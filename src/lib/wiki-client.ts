import { localSearchFallback } from "@/lib/client-pool";
import type { CatalogTitle, Medium } from "@/lib/types";

function extractYearFromWikiText(text: string, timestamp?: string): number | null {
  const titled = text.match(/\((\d{4})\s+(?:[a-z]+\s+)*(?:film|movie|video game)/i);
  if (titled) {
    const year = Number(titled[1]);
    if (year >= 1900) return year;
  }
  const isA = text.match(/\bis an?\s+(\d{4})\b/i);
  if (isA) return Number(isA[1]);
  const years = [...text.matchAll(/\b((?:19|20)\d{2})\b/g)].map((match) => Number(match[1]));
  return years[0] ?? (timestamp ? Number(timestamp.slice(0, 4)) : null);
}

function guessGenres(text: string, medium: Medium): string[] {
  const blob = text.toLowerCase();
  const movieMap: Record<string, string> = {
    comedy: "Comedy",
    horror: "Horror",
    romance: "Romance",
    "science fiction": "Sci-Fi",
    "sci-fi": "Sci-Fi",
    thriller: "Thriller",
    animation: "Animation",
    crime: "Crime",
    action: "Action",
    adventure: "Adventure",
    drama: "Drama",
  };
  const gameMap: Record<string, string> = {
    rpg: "RPG",
    "role-playing": "RPG",
    puzzle: "Puzzle",
    strategy: "Strategy",
    fighting: "Fighting",
    platform: "Platformer",
    simulation: "Simulation",
    indie: "Indie",
    adventure: "Adventure",
    action: "Action",
  };
  const map = medium === "movie" ? movieMap : gameMap;
  const found = Object.entries(map)
    .filter(([key]) => blob.includes(key))
    .map(([, genre]) => genre);
  if (found.length > 0) return [...new Set(found)].slice(0, 3);
  return [medium === "movie" ? "Drama" : "Adventure"];
}

function looksLikeMedium(text: string, medium: Medium, title: string): boolean {
  const blob = `${title} ${text}`.toLowerCase();
  if (medium === "movie") return /film|movie|cinema|directed by|screenplay/.test(blob);
  return /video game|videogame|developer|publisher|platform/.test(blob);
}

function cleanTitle(title: string): string {
  return title.replace(/\s+\([^)]*(film|movie|video game)s?[^)]*\)$/i, "").trim();
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export async function searchWikipediaClient(
  q: string,
  medium: Medium
): Promise<{ results: CatalogTitle[]; source: "wikipedia" | "local" | "none" }> {
  if (q.trim().length < 2) return { results: [], source: "none" };
  const hint = medium === "movie" ? "film" : "video game";
  try {
    const api = new URL("https://en.wikipedia.org/w/api.php");
    api.searchParams.set("action", "query");
    api.searchParams.set("list", "search");
    api.searchParams.set("srsearch", `${q} ${hint}`);
    api.searchParams.set("srlimit", "8");
    api.searchParams.set("format", "json");
    api.searchParams.set("origin", "*");
    const searchRes = await fetch(api.toString());
    if (!searchRes.ok) throw new Error("search failed");
    const searchJson = (await searchRes.json()) as {
      query?: { search?: { title: string; snippet: string }[] };
    };
    const hits = searchJson.query?.search ?? [];
    const pages = await Promise.all(
      hits.slice(0, 6).map(async (hit) => {
        const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(hit.title)}`;
        const summaryRes = await fetch(summaryUrl);
        if (!summaryRes.ok) return null;
        const summary = (await summaryRes.json()) as {
          title?: string;
          description?: string;
          extract?: string;
          timestamp?: string;
          thumbnail?: { source?: string };
          content_urls?: { desktop?: { page?: string } };
        };
        const blob = `${summary.description ?? ""} ${summary.extract ?? ""} ${hit.snippet}`;
        if (!looksLikeMedium(blob, medium, hit.title)) return null;
        const year = extractYearFromWikiText(blob, summary.timestamp) ?? 2000;
        const article =
          summary.content_urls?.desktop?.page ??
          `https://en.wikipedia.org/wiki/${encodeURIComponent((summary.title ?? hit.title).replaceAll(" ", "_"))}`;
        const imageUrl = summary.thumbnail?.source;
        const title: CatalogTitle = {
          id: `wiki-${medium}-${slug(summary.title ?? hit.title)}`,
          medium,
          title: cleanTitle(summary.title ?? hit.title),
          year,
          genres: guessGenres(blob, medium),
          obscurity: 3,
          source: "search",
          imageUrl,
          imageCreditLabel: imageUrl?.includes("/commons/") ? "Wikimedia Commons" : "Wikipedia",
          imageCreditHref: article,
        };
        return title;
      })
    );
    const results = pages.filter((item): item is CatalogTitle => item != null);
    if (results.length > 0) return { results, source: "wikipedia" };
  } catch {
    // local fallback
  }
  const results = localSearchFallback(q, medium);
  return { results, source: results.length > 0 ? "local" : "none" };
}

export async function fetchWikipediaBlurbClient(
  title: string,
  year: string,
  medium: Medium,
  imdb?: string,
  signal?: AbortSignal
) {
  const hint = medium === "movie" ? "film" : "video game";
  const query = [title, year, imdb, hint].filter(Boolean).join(" ");
  const api = new URL("https://en.wikipedia.org/w/api.php");
  api.searchParams.set("action", "query");
  api.searchParams.set("list", "search");
  api.searchParams.set("srsearch", query);
  api.searchParams.set("srlimit", "1");
  api.searchParams.set("format", "json");
  api.searchParams.set("origin", "*");
  const searchRes = await fetch(api.toString(), { signal });
  if (!searchRes.ok) throw new Error("blurb search failed");
  const searchJson = (await searchRes.json()) as { query?: { search?: { title: string }[] } };
  const pageTitle = searchJson.query?.search?.[0]?.title ?? title;
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;
  const summaryRes = await fetch(summaryUrl, { signal });
  if (!summaryRes.ok) throw new Error("summary failed");
  const summary = (await summaryRes.json()) as {
    extract?: string;
    content_urls?: { desktop?: { page?: string } };
  };
  const extract = summary.extract?.trim();
  if (!extract) throw new Error("empty extract");
  return {
    extract,
    sourceUrl:
      summary.content_urls?.desktop?.page ??
      `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle.replaceAll(" ", "_"))}`,
    source: "wikipedia" as const,
  };
}
