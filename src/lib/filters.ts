import { titleIsEnglishDialogue } from "@/lib/language";
import { MPAA_RATINGS, titleMpaa } from "@/lib/mpaa";
import { titleIdentity } from "@/lib/title-identity";
import type { CatalogTitle, Medium, PathFilters, SessionResponse, StackSize } from "@/lib/types";

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
  "Beat 'em Up",
  "Casual",
  "Fighting",
  "Horror",
  "Immersive Sim",
  "Indie",
  "JRPG",
  "Metroidvania",
  "Open World",
  "Party",
  "Platformer",
  "Puzzle",
  "Racing",
  "Rhythm",
  "RPG",
  "Roguelike",
  "Sandbox",
  "Shooter",
  "Simulation",
  "Soulslike",
  "Sports",
  "Stealth",
  "Strategy",
  "Survival",
  "Tactics",
  "Visual Novel",
] as const;

export const MUSIC_GENRES = [
  "Rock",
  "Pop",
  "Hip-Hop",
  "Jazz",
  "Electronic",
  "Classical",
  "Country",
  "R&B",
  "Folk",
  "Metal",
] as const;

export const DECADES = [1940, 1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020] as const;
export const GAME_DECADES = [1970, 1980, 1990, 2000, 2010, 2020] as const;
export const MUSIC_DECADES = [1950, 1960, 1970, 1980, 1990, 2000, 2010, 2020] as const;

/** First-release families that match the current game catalog (handhelds roll into Nintendo / PlayStation). */
export const GAME_PLATFORMS = [
  "Nintendo",
  "PlayStation",
  "Xbox",
  "PC",
  "Mobile",
  "Other",
] as const;

export type GamePlatform = (typeof GAME_PLATFORMS)[number];

export const OBSCURITY_LEVELS = [1, 2, 3, 4, 5] as const;

/** User 1–10 scores from Results (Ranx Seen/Played/Heard and scored Tourney winners). */
export const SCORE_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export const STACK_SIZES = [10, 25, 50, 100] as const;
/** Nearest allowed size to the previous ~40-title Tourney sample. */
export const DEFAULT_STACK_SIZE: StackSize = 50;

export function stackSizeOf(value: number | undefined): StackSize {
  if (value === 10 || value === 25 || value === 50 || value === 100) return value;
  return DEFAULT_STACK_SIZE;
}

export function decadesFor(medium: Medium): readonly number[] {
  if (medium === "game") return GAME_DECADES;
  if (medium === "music") return MUSIC_DECADES;
  return DECADES;
}

export function genresFor(medium: Medium): readonly string[] {
  if (medium === "game") return GAME_GENRES;
  if (medium === "music") return MUSIC_GENRES;
  return MOVIE_GENRES;
}

export function decadeFloor(medium: Medium): number {
  if (medium === "game") return 1970;
  if (medium === "music") return 1950;
  return 1940;
}

export function decadeOf(year: number): number {
  return Math.floor(year / 10) * 10;
}

export type UserScoreIndex = {
  byId: Map<string, number>;
  byKey: Map<string, number>;
};

export function isUserScore(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 10;
}

export function buildUserScoreIndex(responses: SessionResponse[], medium: Medium): UserScoreIndex {
  const byId = new Map<string, number>();
  const byKey = new Map<string, number>();
  for (const entry of responses) {
    if (entry.medium !== medium || !isUserScore(entry.rating)) continue;
    byId.set(entry.titleId, entry.rating);
    byKey.set(
      titleIdentity({
        id: entry.titleId,
        title: entry.title,
        year: entry.year,
        medium: entry.medium,
      }),
      entry.rating
    );
  }
  return { byId, byKey };
}

export function hasUserScores(responses: SessionResponse[], medium: Medium): boolean {
  return responses.some((entry) => entry.medium === medium && isUserScore(entry.rating));
}

export function scoreForTitle(title: CatalogTitle, index: UserScoreIndex): number | undefined {
  return index.byId.get(title.id) ?? index.byKey.get(titleIdentity(title));
}

export function ratingsFilterActive(filters: PathFilters, index: UserScoreIndex): boolean {
  return (filters.scores?.length ?? 0) > 0 && (index.byId.size > 0 || index.byKey.size > 0);
}

function validScores(values: number[] | undefined): number[] {
  const found: number[] = [];
  for (const value of values ?? []) {
    if (!isUserScore(value) || found.includes(value)) continue;
    found.push(value);
  }
  return found.sort((a, b) => a - b);
}

export function defaultFilters(medium: Medium): PathFilters {
  return {
    decades: [...decadesFor(medium)],
    genres: [...genresFor(medium)],
    obscurity: [...OBSCURITY_LEVELS],
    mpaa: medium === "movie" ? [...MPAA_RATINGS] : [],
    includeForeign: true,
    stackSize: DEFAULT_STACK_SIZE,
    platforms: medium === "game" ? [...GAME_PLATFORMS] : [],
  };
}

export function matchesFilters(
  title: CatalogTitle,
  filters: PathFilters,
  ctx?: { scores?: UserScoreIndex }
): boolean {
  const decades = filters.decades ?? [];
  const genres = filters.genres ?? [];
  const obscurity = filters.obscurity ?? [];
  if (decades.length === 0 || genres.length === 0 || obscurity.length === 0) {
    return false;
  }
  const decade = decadeOf(title.year);
  const floor = decadeFloor(title.medium);
  const decadeOk = decades.includes(decade) || (decade < floor && decades.includes(floor));
  const genreOk = title.genres.some((genre) => genres.includes(genre));
  const obscurityOk = obscurity.includes(title.obscurity);
  if (!decadeOk || !genreOk || !obscurityOk) return false;
  if (title.medium === "movie") {
    const allowed = filters.mpaa ?? [];
    if (allowed.length === 0 || !allowed.includes(titleMpaa(title))) return false;
    if (filters.includeForeign === false && !titleIsEnglishDialogue(title)) return false;
  }
  if (title.medium === "game") {
    const allowed = filters.platforms ?? [];
    if (allowed.length === 0) return false;
    const families = titlePlatforms(title);
    if (!families.some((platform) => allowed.includes(platform))) return false;
  }
  const index = ctx?.scores;
  if (index && ratingsFilterActive(filters, index)) {
    const score = scoreForTitle(title, index);
    if (score == null || !filters.scores!.includes(score)) return false;
  }
  return true;
}

export function titlePlatforms(title: CatalogTitle): string[] {
  const listed = (title.platforms ?? []).filter((platform) =>
    (GAME_PLATFORMS as readonly string[]).includes(platform)
  );
  return listed.length > 0 ? listed : ["Other"];
}

export function sanitizeFilters(filters: PathFilters, medium: Medium): PathFilters {
  const defaults = defaultFilters(medium);
  const allowedDecades = new Set(decadesFor(medium));
  const allowedGenres = new Set(genresFor(medium));
  const decades = (filters.decades ?? []).filter((decade) => allowedDecades.has(decade));
  const genres = (filters.genres ?? []).filter((genre) => allowedGenres.has(genre));
  const obscurity = (filters.obscurity ?? []).filter((level) =>
    (OBSCURITY_LEVELS as readonly number[]).includes(level)
  );
  return {
    ...defaults,
    ...filters,
    decades,
    genres,
    obscurity,
    mpaa: medium === "movie" ? (filters.mpaa ?? []) : [],
    includeForeign: filters.includeForeign !== false,
    stackSize: stackSizeOf(filters.stackSize),
    platforms: medium === "game" ? validGamePlatforms(filters) : [],
    scores: validScores(filters.scores),
  };
}

function validGamePlatforms(filters: PathFilters): string[] {
  return (filters.platforms ?? []).filter((platform) =>
    (GAME_PLATFORMS as readonly string[]).includes(platform)
  );
}

export function filtersComplete(
  filters: PathFilters,
  medium: Medium,
  opts?: { requireScores?: boolean }
): boolean {
  if ((filters.decades?.length ?? 0) === 0) return false;
  if ((filters.genres?.length ?? 0) === 0) return false;
  if ((filters.obscurity?.length ?? 0) === 0) return false;
  if (medium === "movie" && (filters.mpaa?.length ?? 0) === 0) return false;
  if (medium === "game" && (filters.platforms?.length ?? 0) === 0) return false;
  if (opts?.requireScores && (filters.scores?.length ?? 0) === 0) return false;
  return true;
}

function shufflePick<T>(items: readonly T[]): T[] {
  const pool = [...items];
  for (let i = pool.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const count = pool.length <= 1 ? pool.length : 1 + Math.floor(Math.random() * (pool.length - 1));
  return pool.slice(0, count);
}

/** Random non-empty selection for every required Filters group (Done-lock safe). */
export function randomizeFilters(medium: Medium, opts?: { requireScores?: boolean }): PathFilters {
  const next: PathFilters = {
    decades: shufflePick(decadesFor(medium)),
    genres: shufflePick(genresFor(medium)),
    obscurity: shufflePick([...OBSCURITY_LEVELS]),
    stackSize: STACK_SIZES[Math.floor(Math.random() * STACK_SIZES.length)] as StackSize,
    mpaa: medium === "movie" ? shufflePick([...MPAA_RATINGS]) : [],
    includeForeign: medium === "movie" ? Math.random() < 0.5 : true,
    platforms: medium === "game" ? shufflePick([...GAME_PLATFORMS]) : [],
    scores: opts?.requireScores ? shufflePick([...SCORE_LEVELS]) : [],
  };
  return sanitizeFilters(next, medium);
}

export function filtersActive(filters: PathFilters, medium: Medium): boolean {
  const defaults = defaultFilters(medium);
  return (
    filters.decades.length !== defaults.decades.length ||
    filters.genres.length !== defaults.genres.length ||
    filters.obscurity.length !== defaults.obscurity.length ||
    (medium === "movie" && (filters.mpaa?.length ?? 0) !== defaults.mpaa.length) ||
    (medium === "movie" && filters.includeForeign === false) ||
    (medium === "game" && (filters.platforms?.length ?? 0) !== GAME_PLATFORMS.length) ||
    stackSizeOf(filters.stackSize) !== defaults.stackSize ||
    (filters.scores?.length ?? 0) > 0
  );
}
