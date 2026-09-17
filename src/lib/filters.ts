import type { CatalogTitle, Medium, PathFilters, PathKey, PlayMode } from "@/lib/types";
import { MPAA_RATINGS, titleMpaa } from "@/lib/mpaa";

export const MOVIE_GENRES = [
  "Action",
  "Adventure",
  "Animation",
  "Comedy",
  "Crime",
  "Drama",
  "Horror",
  "Romance",
  "Sci-Fi",
  "Thriller",
] as const;

export const GAME_GENRES = [
  "Action",
  "Adventure",
  "Fighting",
  "Indie",
  "Platformer",
  "Puzzle",
  "RPG",
  "Simulation",
  "Strategy",
] as const;

export const DECADES = [1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020] as const;

export const OBSCURITY_LEVELS = [1, 2, 3, 4, 5] as const;

export function pathKey(medium: Medium, playMode: PlayMode): PathKey {
  return `${medium}:${playMode}`;
}

export function decadeOf(year: number): number {
  return Math.floor(year / 10) * 10;
}

export function defaultFilters(medium: Medium): PathFilters {
  return {
    decades: [...DECADES],
    genres: [...(medium === "movie" ? MOVIE_GENRES : GAME_GENRES)],
    obscurity: [...OBSCURITY_LEVELS],
    mpaa: medium === "movie" ? [...MPAA_RATINGS] : [],
  };
}

export function matchesFilters(title: CatalogTitle, filters: PathFilters): boolean {
  const decades = filters.decades ?? [];
  const genres = filters.genres ?? [];
  const obscurity = filters.obscurity ?? [];
  if (decades.length === 0 || genres.length === 0 || obscurity.length === 0) {
    return false;
  }
  const decade = decadeOf(title.year);
  const decadeOk = decades.includes(decade) || (decade < 1940 && decades.includes(1940));
  const genreOk = title.genres.some((genre) => genres.includes(genre));
  const obscurityOk = obscurity.includes(title.obscurity);
  if (!decadeOk || !genreOk || !obscurityOk) return false;
  if (title.medium === "movie") {
    const allowed = filters.mpaa ?? [];
    if (allowed.length === 0 || !allowed.includes(titleMpaa(title))) return false;
  }
  return true;
}

export function filtersComplete(filters: PathFilters, medium: Medium): boolean {
  if ((filters.decades?.length ?? 0) === 0) return false;
  if ((filters.genres?.length ?? 0) === 0) return false;
  if ((filters.obscurity?.length ?? 0) === 0) return false;
  if (medium === "movie" && (filters.mpaa?.length ?? 0) === 0) return false;
  return true;
}

export function filtersActive(filters: PathFilters, medium: Medium): boolean {
  const defaults = defaultFilters(medium);
  return (
    filters.decades.length !== defaults.decades.length ||
    filters.genres.length !== defaults.genres.length ||
    filters.obscurity.length !== defaults.obscurity.length ||
    (medium === "movie" && (filters.mpaa?.length ?? 0) !== defaults.mpaa.length)
  );
}
