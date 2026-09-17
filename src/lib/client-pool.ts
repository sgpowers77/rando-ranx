import { SEARCH_FALLBACK, titlesFor } from "@/data/catalog";
import { matchesFilters } from "@/lib/filters";
import { publicUrl } from "@/lib/public-url";
import type { CatalogTitle, Medium, PathFilters } from "@/lib/types";

type IndexFile = {
  source?: string;
    movies?: Array<{
    id: string;
    title: string;
    year: number;
    genres: string[];
    obscurity: CatalogTitle["obscurity"];
    imdbId?: string;
    mpaa?: string;
  }>;
};

let movieCache: CatalogTitle[] | null = null;
let movieSource: "dataset" | "catalog" = "catalog";

function shuffle<T>(items: T[]): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export async function loadMovieCatalog(): Promise<{ titles: CatalogTitle[]; source: "dataset" | "catalog" }> {
  if (movieCache) return { titles: movieCache, source: movieSource };
  try {
    const res = await fetch(publicUrl("movies-index.json"));
    if (!res.ok) throw new Error("index missing");
    const data = (await res.json()) as IndexFile;
    const movies = (data.movies ?? []).map((item) => ({
      id: item.id,
      medium: "movie" as const,
      title: item.title,
      year: item.year,
      genres: item.genres,
      obscurity: item.obscurity,
      source: "dataset" as const,
      imdbId: item.imdbId,
      mpaa: item.mpaa,
    }));
    if (movies.length === 0) throw new Error("empty index");
    movieCache = movies;
    movieSource = "dataset";
    return { titles: movies, source: "dataset" };
  } catch {
    movieCache = titlesFor("movie");
    movieSource = "catalog";
    return { titles: movieCache, source: "catalog" };
  }
}

export async function sampleClientPool(options: {
  medium: Medium;
  filters: PathFilters;
  excludeIds?: string[];
  limit?: number;
}): Promise<{ titles: CatalogTitle[]; source: "dataset" | "catalog"; available: number }> {
  const limit = Math.min(Math.max(options.limit ?? 36, 8), 80);
  const exclude = new Set(options.excludeIds ?? []);
  if (options.medium === "game") {
    const eligible = titlesFor("game").filter(
      (item) => !exclude.has(item.id) && matchesFilters(item, options.filters)
    );
    return { titles: shuffle(eligible).slice(0, limit), source: "catalog", available: eligible.length };
  }
  const loaded = await loadMovieCatalog();
  const eligible = loaded.titles.filter(
    (item) => !exclude.has(item.id) && matchesFilters(item, options.filters)
  );
  return {
    titles: shuffle(eligible).slice(0, limit),
    source: loaded.source,
    available: eligible.length,
  };
}

export function localSearchFallback(q: string, medium: Medium): CatalogTitle[] {
  const needle = q.toLowerCase();
  return SEARCH_FALLBACK.filter(
    (item) => item.medium === medium && item.title.toLowerCase().includes(needle)
  ).slice(0, 8);
}
