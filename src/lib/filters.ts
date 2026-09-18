import { titleIsEnglishDialogue } from "@/lib/language";
import { MPAA_RATINGS, titleMpaa } from "@/lib/mpaa";
import type { CatalogTitle, Medium, PathFilters, PathKey, PlayMode, StackSize } from "@/lib/types";

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
export const GAME_DECADES = [1970, 1980, 1990, 2000, 2010, 2020] as const;

export const OBSCURITY_LEVELS = [1, 2, 3, 4, 5] as const;

export const STACK_SIZES = [10, 25, 50] as const;
/** Nearest allowed size to the previous ~40-title Tourney sample. */
export const DEFAULT_STACK_SIZE: StackSize = 50;

export function stackSizeOf(value: number | undefined): StackSize {
  if (value === 10 || value === 25 || value === 50) return value;
  return DEFAULT_STACK_SIZE;
}

export function decadesFor(medium: Medium): readonly number[] {
  return medium === "game" ? GAME_DECADES : DECADES;
}

export function pathKey(medium: Medium, playMode: PlayMode): PathKey {
  return `${medium}:${playMode}`;
}

export function decadeOf(year: number): number {
  return Math.floor(year / 10) * 10;
}

export function defaultFilters(medium: Medium): PathFilters {
  return {
    decades: [...decadesFor(medium)],
    genres: [...(medium === "movie" ? MOVIE_GENRES : GAME_GENRES)],
    obscurity: [...OBSCURITY_LEVELS],
    mpaa: medium === "movie" ? [...MPAA_RATINGS] : [],
    includeForeign: true,
    stackSize: DEFAULT_STACK_SIZE,
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
  const floor = title.medium === "game" ? 1970 : 1940;
  const decadeOk = decades.includes(decade) || (decade < floor && decades.includes(floor));
  const genreOk = title.genres.some((genre) => genres.includes(genre));
  const obscurityOk = obscurity.includes(title.obscurity);
  if (!decadeOk || !genreOk || !obscurityOk) return false;
  if (title.medium === "movie") {
    const allowed = filters.mpaa ?? [];
    if (allowed.length === 0 || !allowed.includes(titleMpaa(title))) return false;
    if (filters.includeForeign === false && !titleIsEnglishDialogue(title)) return false;
  }
  return true;
}

export function sanitizeFilters(filters: PathFilters, medium: Medium): PathFilters {
  const defaults = defaultFilters(medium);
  const allowedDecades = new Set(decadesFor(medium));
  const decades = (filters.decades ?? []).filter((decade) => allowedDecades.has(decade));
  return {
    ...defaults,
    ...filters,
    decades: decades.length > 0 ? decades : [...defaults.decades],
    genres: (filters.genres?.length ?? 0) > 0 ? filters.genres : [...defaults.genres],
    obscurity: (filters.obscurity?.length ?? 0) > 0 ? filters.obscurity : [...defaults.obscurity],
    mpaa: medium === "movie" ? ((filters.mpaa?.length ?? 0) > 0 ? filters.mpaa : [...defaults.mpaa]) : [],
    includeForeign: filters.includeForeign !== false,
    stackSize: stackSizeOf(filters.stackSize),
  };
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
    (medium === "movie" && (filters.mpaa?.length ?? 0) !== defaults.mpaa.length) ||
    (medium === "movie" && filters.includeForeign === false) ||
    stackSizeOf(filters.stackSize) !== defaults.stackSize
  );
}
