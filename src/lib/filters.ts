import type { CatalogTitle, Medium, PathFilters, PathKey, PlayMode } from "@/lib/types";

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
  };
}

export function matchesFilters(title: CatalogTitle, filters: PathFilters): boolean {
  const decade = decadeOf(title.year);
  const decadeOk =
    filters.decades.length === 0 ||
    filters.decades.includes(decade) ||
    (decade < 1940 && filters.decades.includes(1940));
  const genreOk =
    filters.genres.length === 0 || title.genres.some((genre) => filters.genres.includes(genre));
  const obscurityOk =
    filters.obscurity.length === 0 || filters.obscurity.includes(title.obscurity);
  return decadeOk && genreOk && obscurityOk;
}

export function filtersActive(filters: PathFilters, medium: Medium): boolean {
  const defaults = defaultFilters(medium);
  return (
    filters.decades.length !== defaults.decades.length ||
    filters.genres.length !== defaults.genres.length ||
    filters.obscurity.length !== defaults.obscurity.length
  );
}
