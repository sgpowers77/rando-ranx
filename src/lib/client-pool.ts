import { SEARCH_FALLBACK, titlesFor } from "@/data/catalog";
import { matchesFilters, stackSizeOf } from "@/lib/filters";
import { publicUrl } from "@/lib/public-url";
import { mergeCatalogTitles, uniqueTitles } from "@/lib/title-identity";
import type { CatalogTitle, Medium, PathFilters } from "@/lib/types";

type MovieIndexFile = {
  source?: string;
  movies?: Array<{
    id: string;
    title: string;
    year: number;
    genres: string[];
    obscurity: CatalogTitle["obscurity"];
    imdbId?: string;
    mpaa?: string;
    en?: boolean;
    englishDialogue?: boolean;
    originalLanguage?: string;
    director?: string;
  }>;
};

type GameIndexFile = {
  source?: string;
  games?: Array<{
    id: string;
    title: string;
    year: number;
    genres: string[];
    obscurity: CatalogTitle["obscurity"];
    platforms?: string[];
    steamAppId?: string;
    imageUrl?: string;
  }>;
};

type MusicIndexFile = {
  source?: string;
  albums?: Array<{
    id: string;
    title: string;
    year: number;
    genres: string[];
    obscurity: CatalogTitle["obscurity"];
    artist?: string;
    musicbrainzId?: string;
    imageUrl?: string;
  }>;
};

let movieCache: CatalogTitle[] | null = null;
let movieSource: "dataset" | "catalog" = "catalog";
let gameCache: CatalogTitle[] | null = null;
let gameSource: "dataset" | "catalog" = "catalog";
let musicCache: CatalogTitle[] | null = null;
let musicSource: "dataset" | "catalog" = "catalog";

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
    const data = (await res.json()) as MovieIndexFile;
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
      originalLanguage: item.originalLanguage,
      englishDialogue: item.en ?? item.englishDialogue,
      director: item.director?.trim() || undefined,
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

export async function loadGameCatalog(): Promise<{ titles: CatalogTitle[]; source: "dataset" | "catalog" }> {
  if (gameCache) return { titles: gameCache, source: gameSource };
  try {
    const res = await fetch(publicUrl("games-index.json"));
    if (!res.ok) throw new Error("index missing");
    const data = (await res.json()) as GameIndexFile;
    const fromIndex = (data.games ?? []).map((item) => ({
      id: item.id,
      medium: "game" as const,
      title: item.title,
      year: item.year,
      genres: item.genres,
      obscurity: item.obscurity,
      source: "dataset" as const,
      platforms: item.platforms ?? ["Other"],
      steamAppId: item.steamAppId,
      imageUrl: item.imageUrl,
    }));
    const games = mergeCatalogTitles([...titlesFor("game"), ...fromIndex]);
    if (games.length === 0) throw new Error("empty index");
    gameCache = games;
    gameSource = fromIndex.length > 0 ? "dataset" : "catalog";
    return { titles: games, source: gameSource };
  } catch {
    gameCache = titlesFor("game");
    gameSource = "catalog";
    return { titles: gameCache, source: "catalog" };
  }
}

export async function loadMusicCatalog(): Promise<{ titles: CatalogTitle[]; source: "dataset" | "catalog" }> {
  if (musicCache) return { titles: musicCache, source: musicSource };
  try {
    const res = await fetch(publicUrl("music-index.json"));
    if (!res.ok) throw new Error("index missing");
    const data = (await res.json()) as MusicIndexFile;
    const fromIndex = (data.albums ?? []).map((item) => ({
      id: item.id,
      medium: "music" as const,
      title: item.title,
      year: item.year,
      genres: item.genres,
      obscurity: item.obscurity,
      source: "dataset" as const,
      artist: item.artist,
      musicbrainzId: item.musicbrainzId,
      imageUrl: item.imageUrl,
    }));
    const albums = mergeCatalogTitles([...titlesFor("music"), ...fromIndex]);
    if (albums.length === 0) throw new Error("empty index");
    musicCache = albums;
    musicSource = fromIndex.length > 0 ? "dataset" : "catalog";
    return { titles: albums, source: musicSource };
  } catch {
    musicCache = titlesFor("music");
    musicSource = "catalog";
    return { titles: musicCache, source: "catalog" };
  }
}

export async function sampleClientPool(options: {
  medium: Medium;
  filters: PathFilters;
  excludeIds?: string[];
  limit?: number;
  /** Exact draw size. Use this for Skip replenishment; `limit` is a stack-size bucket. */
  count?: number;
}): Promise<{ titles: CatalogTitle[]; source: "dataset" | "catalog"; available: number }> {
  const take =
    typeof options.count === "number" && Number.isFinite(options.count) && options.count > 0
      ? Math.floor(options.count)
      : stackSizeOf(options.limit);
  const exclude = new Set(options.excludeIds ?? []);
  if (options.medium === "game") {
    const loaded = await loadGameCatalog();
    const eligible = uniqueTitles(
      loaded.titles.filter((item) => !exclude.has(item.id) && matchesFilters(item, options.filters))
    );
    return {
      titles: shuffle(eligible).slice(0, take),
      source: loaded.source,
      available: eligible.length,
    };
  }
  if (options.medium === "music") {
    const loaded = await loadMusicCatalog();
    const eligible = uniqueTitles(
      loaded.titles.filter((item) => !exclude.has(item.id) && matchesFilters(item, options.filters))
    );
    return {
      titles: shuffle(eligible).slice(0, take),
      source: loaded.source,
      available: eligible.length,
    };
  }
  const loaded = await loadMovieCatalog();
  const eligible = loaded.titles.filter(
    (item) => !exclude.has(item.id) && matchesFilters(item, options.filters)
  );
  const sampled = shuffle(eligible).slice(0, take);
  return {
    titles: sampled,
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
