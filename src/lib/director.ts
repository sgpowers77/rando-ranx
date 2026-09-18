import type { CatalogTitle } from "@/lib/types";

const cache = new Map<string, string | null>();

function cacheKey(title: Pick<CatalogTitle, "id" | "title" | "year" | "imdbId">): string {
  return title.imdbId || title.id || `${title.title}|${title.year}`;
}

export function directorFromExtract(text: string): string | null {
  const match = text.match(/\bdirected by\s+([A-Z][\w.'-]+(?:\s+[A-Z][\w.'-]+){0,4}(?:\s+and\s+[A-Z][\w.'-]+(?:\s+[A-Z][\w.'-]+){0,4})?)/);
  if (!match) return null;
  const name = match[1].replace(/\s+/g, " ").replace(/[,.].*$/, "").trim();
  return name.length >= 3 ? name : null;
}

function joinNames(names: string[]): string {
  const unique = [...new Set(names.map((name) => name.trim()).filter(Boolean))];
  if (unique.length === 0) return "";
  if (unique.length === 1) return unique[0];
  if (unique.length === 2) return `${unique[0]} and ${unique[1]}`;
  return `${unique.slice(0, -1).join(", ")}, and ${unique[unique.length - 1]}`;
}

export async function directorsByImdbIds(
  ids: string[],
  signal?: AbortSignal
): Promise<Map<string, string>> {
  const valid = [...new Set(ids.filter((id) => /^tt\d+$/.test(id)))];
  const found = new Map<string, string>();
  if (valid.length === 0) return found;
  const values = valid.map((id) => `"${id}"`).join(" ");
  const query = `SELECT ?imdb ?name WHERE {
    VALUES ?imdb { ${values} }
    ?film wdt:P345 ?imdb .
    ?film wdt:P57 ?director .
    ?director rdfs:label ?name .
    FILTER(LANG(?name) = "en")
  }`;
  try {
    const url = new URL("https://query.wikidata.org/sparql");
    url.searchParams.set("format", "json");
    url.searchParams.set("query", query);
    const res = await fetch(url.toString(), {
      signal,
      headers: { Accept: "application/sparql-results+json" },
    });
    if (!res.ok) return found;
    const data = (await res.json()) as {
      results?: { bindings?: Array<{ imdb?: { value?: string }; name?: { value?: string } }> };
    };
    const grouped = new Map<string, string[]>();
    for (const row of data.results?.bindings ?? []) {
      const imdb = row.imdb?.value;
      const name = row.name?.value?.trim();
      if (!imdb || !name) continue;
      grouped.set(imdb, [...(grouped.get(imdb) ?? []), name]);
    }
    for (const [imdb, names] of grouped) {
      const label = joinNames(names);
      if (label) found.set(imdb, label);
    }
  } catch {
    // offline / CORS
  }
  return found;
}

async function directorFromWikipedia(
  title: string,
  year: number,
  signal?: AbortSignal
): Promise<string | null> {
  try {
    const api = new URL("https://en.wikipedia.org/w/api.php");
    api.searchParams.set("action", "query");
    api.searchParams.set("list", "search");
    api.searchParams.set("srsearch", `"${title}" ${year} film`);
    api.searchParams.set("srlimit", "1");
    api.searchParams.set("format", "json");
    api.searchParams.set("origin", "*");
    const searchRes = await fetch(api.toString(), { signal });
    if (!searchRes.ok) return null;
    const searchJson = (await searchRes.json()) as { query?: { search?: { title: string }[] } };
    const pageTitle = searchJson.query?.search?.[0]?.title;
    if (!pageTitle) return null;
    const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;
    const summaryRes = await fetch(summaryUrl, { signal });
    if (!summaryRes.ok) return null;
    const summary = (await summaryRes.json()) as { description?: string; extract?: string };
    return directorFromExtract(`${summary.description ?? ""} ${summary.extract ?? ""}`);
  } catch {
    return null;
  }
}

export function cachedDirector(title: Pick<CatalogTitle, "id" | "title" | "year" | "imdbId" | "director">): string | undefined {
  const seeded = title.director?.trim();
  if (seeded) return seeded;
  return cache.get(cacheKey(title)) ?? undefined;
}

export async function lookupDirector(
  title: CatalogTitle,
  signal?: AbortSignal
): Promise<string | null> {
  if (title.medium !== "movie") return null;
  if (title.director?.trim()) return title.director.trim();
  const key = cacheKey(title);
  if (cache.has(key)) return cache.get(key) ?? null;
  let name: string | null = null;
  if (title.imdbId) {
    const byImdb = await directorsByImdbIds([title.imdbId], signal);
    name = byImdb.get(title.imdbId) ?? null;
  }
  if (!name) name = await directorFromWikipedia(title.title, title.year, signal);
  cache.set(key, name);
  return name;
}

export async function withDirectors(titles: CatalogTitle[], signal?: AbortSignal): Promise<CatalogTitle[]> {
  const movies = titles.filter((item) => item.medium === "movie" && !item.director);
  const byImdb = await directorsByImdbIds(
    movies.map((item) => item.imdbId ?? "").filter(Boolean),
    signal
  );
  return Promise.all(
    titles.map(async (item) => {
      if (item.medium !== "movie") return item;
      if (item.director?.trim()) return item;
      const fromImdb = item.imdbId ? byImdb.get(item.imdbId) : undefined;
      if (fromImdb) {
        cache.set(cacheKey(item), fromImdb);
        return { ...item, director: fromImdb };
      }
      const fromWiki = await lookupDirector(item, signal);
      return fromWiki ? { ...item, director: fromWiki } : item;
    })
  );
}

export function parseWatchedDate(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : undefined;
}
