import { SEARCH_FALLBACK } from "@/data/catalog";
import type { CatalogTitle, Medium } from "@/lib/types";
import {
  extractYearFromWikiText,
  releaseYearForPage,
  WIKI_UA,
} from "@/lib/wiki-lookup";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  const medium = request.nextUrl.searchParams.get("medium") === "game" ? "game" : "movie";
  if (q.length < 2) {
    return NextResponse.json({ results: [], source: "none" });
  }

  try {
    const remote = await searchWikipedia(q, medium);
    if (remote.length > 0) {
      return NextResponse.json({ results: remote, source: "wikipedia" });
    }
  } catch {
    // fall through to local catalog
  }

  const needle = q.toLowerCase();
  const results = SEARCH_FALLBACK.filter(
    (item) => item.medium === medium && item.title.toLowerCase().includes(needle)
  ).slice(0, 8);
  return NextResponse.json({ results, source: "local" });
}

async function searchWikipedia(q: string, medium: Medium): Promise<CatalogTitle[]> {
  const hint = medium === "movie" ? "film" : "video game";
  const api = new URL("https://en.wikipedia.org/w/api.php");
  api.searchParams.set("action", "query");
  api.searchParams.set("list", "search");
  api.searchParams.set("srsearch", `${q} ${hint}`);
  api.searchParams.set("srlimit", "8");
  api.searchParams.set("format", "json");
  api.searchParams.set("utf8", "1");

  const searchRes = await fetch(api, {
    headers: { "User-Agent": WIKI_UA, Accept: "application/json" },
    next: { revalidate: 0 },
  });
  if (!searchRes.ok) throw new Error("Wikipedia search failed");
  const searchJson = (await searchRes.json()) as {
    query?: { search?: { title: string; snippet: string }[] };
  };
  const hits = searchJson.query?.search ?? [];

  const pages = await Promise.all(
    hits.slice(0, 6).map(async (hit) => {
      const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(hit.title)}`;
      const summaryRes = await fetch(summaryUrl, {
        headers: { "User-Agent": WIKI_UA, Accept: "application/json" },
      });
      if (!summaryRes.ok) return null;
      const summary = (await summaryRes.json()) as {
        title?: string;
        description?: string;
        extract?: string;
        timestamp?: string;
      };
      const blob = `${summary.description ?? ""} ${summary.extract ?? ""} ${hit.snippet}`;
      if (!looksLikeMedium(blob, medium, hit.title)) return null;
      const wikiYear = await releaseYearForPage(hit.title);
      const year =
        wikiYear ?? extractYearFromWikiText(blob, summary.timestamp) ?? 2000;
      const title: CatalogTitle = {
        id: `wiki-${medium}-${slug(summary.title ?? hit.title)}`,
        medium,
        title: cleanTitle(summary.title ?? hit.title),
        year,
        genres: guessGenres(blob, medium),
        obscurity: 3,
        source: "search",
      };
      return title;
    })
  );

  return pages.filter((item): item is CatalogTitle => item != null);
}

function looksLikeMedium(text: string, medium: Medium, title: string): boolean {
  const blob = `${title} ${text}`.toLowerCase();
  if (medium === "movie") {
    return /film|movie|cinema|directed by|screenplay/.test(blob);
  }
  return /video game|videogame|developer|publisher|platform/.test(blob);
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
