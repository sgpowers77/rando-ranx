import { readFileSync } from "node:fs";
import path from "node:path";
import { MOVIE_GENRES, matchesFilters, stackSizeOf } from "@/lib/filters";
import { ensureMoviesMetadata, moviesMetadataPath } from "@/lib/dataset-file";
import { titlesFor } from "@/data/catalog";
import { uniqueTitles } from "@/lib/title-identity";
import { isEnglishDialogueFilm } from "@/lib/language";
import { obscurityFromSignals } from "@/lib/obscurity";
import type { CatalogTitle, Medium, PathFilters } from "@/lib/types";

export type PoolSource = "dataset" | "catalog";

type MovieRow = CatalogTitle & {
  popularity: number;
  voteCount: number;
  imdbId?: string;
};

let movieIndex: MovieRow[] | null = null;
let loadError: string | null = null;
let loadPromise: Promise<MovieRow[]> | null = null;

const GENRE_ALIAS: Record<string, string> = {
  Animation: "Animation",
  Comedy: "Comedy",
  Family: "Adventure",
  Adventure: "Adventure",
  Action: "Action",
  Crime: "Crime",
  Drama: "Drama",
  Horror: "Horror",
  Romance: "Romance",
  Thriller: "Thriller",
  Mystery: "Thriller",
  Fantasy: "Adventure",
  "Science Fiction": "Sci-Fi",
  War: "Drama",
  Western: "Action",
  History: "Drama",
  Music: "Drama",
  Documentary: "Drama",
  "TV Movie": "Drama",
};

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      inQuotes = true;
      continue;
    }
    if (char === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (char === "\n") {
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
      continue;
    }
    if (char === "\r") continue;
    field += char;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

function parseGenres(raw: string): string[] {
  const names = [...raw.matchAll(/'name':\s*'([^']+)'/g)].map((match) => match[1]);
  if (names.length === 0) {
    names.push(...[...raw.matchAll(/"name":\s*"([^"]+)"/g)].map((match) => match[1]));
  }
  const mapped = names
    .map((name) => GENRE_ALIAS[name] ?? (MOVIE_GENRES as readonly string[]).find((genre) => genre === name))
    .filter((name): name is string => Boolean(name));
  return [...new Set(mapped)];
}

function obscurityFrom(popularity: number, voteCount: number, extra?: {
  budget?: number;
  revenue?: number;
  voteAverage?: number;
}): CatalogTitle["obscurity"] {
  return obscurityFromSignals({
    popularity,
    voteCount,
    budget: extra?.budget,
    revenue: extra?.revenue,
    voteAverage: extra?.voteAverage,
  });
}

function headerIndex(header: string[], name: string): number {
  return header.findIndex((col) => col.trim() === name);
}

function buildIndex(csvText: string): MovieRow[] {
  const rows = parseCsv(csvText);
  const header = rows[0] ?? [];
  const iAdult = headerIndex(header, "adult");
  const iGenres = headerIndex(header, "genres");
  const iId = headerIndex(header, "id");
  const iImdb = headerIndex(header, "imdb_id");
  const iPop = headerIndex(header, "popularity");
  const iDate = headerIndex(header, "release_date");
  const iTitle = headerIndex(header, "title");
  const iVotes = headerIndex(header, "vote_count");
  const iBudget = headerIndex(header, "budget");
  const iRevenue = headerIndex(header, "revenue");
  const iVoteAvg = headerIndex(header, "vote_average");
  const iOrigLang = headerIndex(header, "original_language");
  const iSpoken = headerIndex(header, "spoken_languages");
  if (iTitle < 0 || iDate < 0 || iId < 0) {
    throw new Error("movies_metadata.csv is missing title, release_date, or id");
  }

  const seen = new Set<string>();
  const index: MovieRow[] = [];
  for (let r = 1; r < rows.length; r += 1) {
    const cols = rows[r];
    if (!cols || cols.length < header.length - 2) continue;
    if ((cols[iAdult] ?? "").toLowerCase() === "true") continue;
    const title = (cols[iTitle] ?? "").trim();
    if (!title) continue;
    const year = Number((cols[iDate] ?? "").slice(0, 4));
    if (!Number.isFinite(year) || year < 1900 || year > 2030) continue;
    const tmdbId = (cols[iId] ?? "").trim();
    if (!/^\d+$/.test(tmdbId)) continue;
    const id = `tmdb-${tmdbId}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const genres = parseGenres(cols[iGenres] ?? "");
    if (genres.length === 0) genres.push("Drama");
    const popularity = Number(cols[iPop] ?? 0) || 0;
    const voteCount = Number(cols[iVotes] ?? 0) || 0;
    const budget = Number(cols[iBudget] ?? 0) || 0;
    const revenue = Number(cols[iRevenue] ?? 0) || 0;
    const voteAverage = Number(cols[iVoteAvg] ?? 0) || 0;
    const originalLanguage = (cols[iOrigLang] ?? "").trim() || undefined;
    const englishDialogue = isEnglishDialogueFilm(originalLanguage, cols[iSpoken] ?? "");
    const imdbId = (cols[iImdb] ?? "").trim();
    index.push({
      id,
      medium: "movie",
      title,
      year,
      genres,
      obscurity: obscurityFrom(popularity, voteCount, { budget, revenue, voteAverage }),
      source: "dataset",
      popularity,
      voteCount,
      imdbId: /^tt\d+$/.test(imdbId) ? imdbId : undefined,
      mpaa: "Not Rated",
      originalLanguage,
      englishDialogue,
    });
  }
  return index;
}

export async function loadMovieIndex(): Promise<MovieRow[]> {
  if (movieIndex) return movieIndex;
  if (loadPromise) return loadPromise;
  loadPromise = (async () => {
    try {
      await ensureMoviesMetadata();
      const text = readFileSync(moviesMetadataPath(), "utf8");
      movieIndex = buildIndex(text);
      loadError = null;
      return movieIndex;
    } catch (error) {
      loadError = error instanceof Error ? error.message : "Could not load movies_metadata.csv";
      movieIndex = [];
      throw error;
    } finally {
      loadPromise = null;
    }
  })();
  return loadPromise;
}

export function movieIndexStatus(): { loaded: number; error: string | null; path: string } {
  return {
    loaded: movieIndex?.length ?? 0,
    error: loadError,
    path: moviesMetadataPath(),
  };
}

function shuffleInPlace<T>(items: T[]): T[] {
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items;
}

function loadGamesIndexSync(): CatalogTitle[] {
  try {
    const filePath = path.join(process.cwd(), "public", "games-index.json");
    const data = JSON.parse(readFileSync(filePath, "utf8")) as {
      games?: Array<{
        id: string;
        title: string;
        year: number;
        genres: string[];
        obscurity: CatalogTitle["obscurity"];
        platforms?: string[];
      }>;
    };
    return (data.games ?? []).map((item) => ({
      id: item.id,
      medium: "game" as const,
      title: item.title,
      year: item.year,
      genres: item.genres,
      obscurity: item.obscurity,
      source: "dataset" as const,
      platforms: item.platforms ?? ["Other"],
    }));
  } catch {
    return [];
  }
}

export async function sampleTitlePool(options: {
  medium: Medium;
  filters: PathFilters;
  excludeIds?: string[];
  limit?: number;
}): Promise<{ titles: CatalogTitle[]; source: PoolSource; available: number; error?: string }> {
  const limit = stackSizeOf(options.limit);
  const exclude = new Set(options.excludeIds ?? []);
  const filters = options.filters;

  if (options.medium === "game") {
    const fromIndex = loadGamesIndexSync();
    const pool = uniqueTitles([...titlesFor("game"), ...fromIndex]);
    const eligible = uniqueTitles(
      pool.filter((item) => !exclude.has(item.id) && matchesFilters(item, filters))
    );
    return {
      titles: shuffleInPlace([...eligible]).slice(0, limit),
      source: fromIndex.length > 0 ? "dataset" : "catalog",
      available: eligible.length,
    };
  }

  try {
    const index = await loadMovieIndex();
    const eligible = index.filter((item) => !exclude.has(item.id) && matchesFilters(item, filters));
    const sampled = shuffleInPlace([...eligible]).slice(0, limit).map((item) => ({
      id: item.id,
      medium: item.medium,
      title: item.title,
      year: item.year,
      genres: item.genres,
      obscurity: item.obscurity,
      source: "dataset" as const,
      imdbId: item.imdbId,
      mpaa: item.mpaa,
      originalLanguage: item.originalLanguage,
      englishDialogue: item.englishDialogue,
    }));
    return { titles: sampled, source: "dataset", available: eligible.length };
  } catch (error) {
    const eligible = titlesFor("movie").filter(
      (item) => !exclude.has(item.id) && matchesFilters(item, filters)
    );
    return {
      titles: shuffleInPlace([...eligible]).slice(0, limit),
      source: "catalog",
      available: eligible.length,
      error: error instanceof Error ? error.message : "Dataset unavailable",
    };
  }
}
