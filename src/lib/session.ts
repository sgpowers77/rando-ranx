import { resolveTitle, titlesFor, withReleaseYear } from "@/data/catalog";
import { defaultFilters, matchesFilters, pathKey } from "@/lib/filters";
import type {
  CatalogTitle,
  DiscardEntry,
  Medium,
  PathFilters,
  PathKey,
  PlayMode,
  SessionResponse,
  StoredSession,
} from "@/lib/types";

export const STORAGE_KEY = "randoranx-session-v1";

export const EMPTY_SESSION: StoredSession = {
  version: 1,
  medium: null,
  playMode: null,
  remainingIds: { movie: [], game: [] },
  responses: [],
  discards: [],
  watchTags: [],
  pendingTourney: null,
  skipTourneyScoring: false,
  customTitles: [],
  pathFilters: {},
  recentlyShown: { movie: [], game: [] },
  releaseYears: {},
};

export function shuffleIds(ids: string[]): string[] {
  const next = [...ids];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function filtersFor(session: StoredSession, medium: Medium, playMode: PlayMode): PathFilters {
  return session.pathFilters[pathKey(medium, playMode)] ?? defaultFilters(medium);
}

export function usedTitleIds(session: StoredSession, medium: Medium): Set<string> {
  const used = new Set<string>();
  for (const entry of session.responses) {
    if (entry.medium === medium) used.add(entry.titleId);
  }
  for (const entry of session.discards) {
    if (entry.medium === medium) used.add(entry.titleId);
  }
  for (const entry of session.watchTags ?? []) {
    if (entry.medium === medium) used.add(entry.titleId);
  }
  return used;
}

const RECENT_CAP = 12;

export function rememberShown(session: StoredSession, medium: Medium, ids: string[]): string[] {
  const next = [...(session.recentlyShown?.[medium] ?? [])];
  for (const id of ids) {
    const index = next.indexOf(id);
    if (index >= 0) next.splice(index, 1);
    next.push(id);
  }
  return next.slice(-RECENT_CAP);
}

export function withDealtQueue(
  session: StoredSession,
  medium: Medium,
  playMode: PlayMode,
  pinnedId?: string
): StoredSession {
  const queue = dealtQueue(session, medium, playMode, pinnedId);
  const shown = playMode === "tourney" ? queue.slice(0, 2) : queue.slice(0, 1);
  return {
    ...session,
    remainingIds: { ...session.remainingIds, [medium]: queue },
    recentlyShown: {
      movie: session.recentlyShown?.movie ?? [],
      game: session.recentlyShown?.game ?? [],
      [medium]: rememberShown(session, medium, shown),
    },
  };
}

function catalogWithYears(session: StoredSession, medium: Medium): CatalogTitle[] {
  const extras = session.customTitles.filter((item) => item.medium === medium);
  return [...titlesFor(medium), ...extras].map((item) => withReleaseYear(item, session.releaseYears));
}

export function eligibleFor(session: StoredSession, medium: Medium, playMode: PlayMode): CatalogTitle[] {
  const filters = filtersFor(session, medium, playMode);
  return catalogWithYears(session, medium).filter((item) => matchesFilters(item, filters));
}

export function poolFor(session: StoredSession, medium: Medium, playMode: PlayMode): CatalogTitle[] {
  const used = usedTitleIds(session, medium);
  const eligible = eligibleFor(session, medium, playMode);
  const unused = eligible.filter((item) => !used.has(item.id));
  return unused.length > 0 ? unused : eligible;
}

export function dealtQueue(
  session: StoredSession,
  medium: Medium,
  playMode: PlayMode,
  pinnedId?: string
): string[] {
  const eligible = eligibleFor(session, medium, playMode);
  const used = usedTitleIds(session, medium);
  const unused = eligible.filter((item) => !used.has(item.id));
  const pool = unused.length > 0 ? unused : eligible;
  const recent = new Set((session.recentlyShown?.[medium] ?? []).filter((id) => id !== pinnedId));
  const fresh = pool.filter((item) => item.id !== pinnedId && !recent.has(item.id));
  const stale = pool.filter((item) => item.id !== pinnedId && recent.has(item.id));
  const rest = [...shuffleIds(fresh.map((item) => item.id)), ...shuffleIds(stale.map((item) => item.id))];
  if (pinnedId) return [pinnedId, ...rest.filter((id) => id !== pinnedId)];
  return rest;
}

export function ensureQueue(session: StoredSession, medium: Medium, playMode: PlayMode): string[] {
  return dealtQueue(session, medium, playMode);
}

function parseIdList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((id): id is string => typeof id === "string");
}

function parseWatchTags(value: unknown): StoredSession["watchTags"] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is StoredSession["watchTags"][number] => {
    if (!entry || typeof entry.titleId !== "string" || typeof entry.title !== "string") return false;
    if (typeof entry.year !== "number") return false;
    return entry.medium === "movie" || entry.medium === "game";
  });
}

function parseCustomTitles(value: unknown): CatalogTitle[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is CatalogTitle => {
    if (!item || typeof item.id !== "string" || typeof item.title !== "string") return false;
    if (typeof item.year !== "number") return false;
    if (item.medium !== "movie" && item.medium !== "game") return false;
    if (!Array.isArray(item.genres)) return false;
    return [1, 2, 3, 4, 5].includes(item.obscurity);
  });
}

function parsePathFilters(value: unknown): StoredSession["pathFilters"] {
  if (!value || typeof value !== "object") return {};
  const next: StoredSession["pathFilters"] = {};
  for (const key of ["movie:rank", "movie:tourney", "game:rank", "game:tourney"] as PathKey[]) {
    const raw = (value as Record<string, PathFilters | undefined>)[key];
    if (!raw) continue;
    next[key] = {
      decades: Array.isArray(raw.decades) ? raw.decades.filter((n) => typeof n === "number") : [],
      genres: Array.isArray(raw.genres) ? raw.genres.filter((n) => typeof n === "string") : [],
      obscurity: Array.isArray(raw.obscurity)
        ? raw.obscurity.filter((n) => typeof n === "number")
        : [],
    };
  }
  return next;
}

function parsePlayMode(value: unknown): PlayMode | null {
  return value === "rank" || value === "tourney" ? value : null;
}

function parseDiscards(value: unknown): DiscardEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter((entry): entry is DiscardEntry => {
    if (!entry || typeof entry.id !== "string" || typeof entry.titleId !== "string") return false;
    if (typeof entry.title !== "string" || typeof entry.year !== "number") return false;
    return entry.medium === "movie" || entry.medium === "game";
  }).map((entry) => ({
    ...entry,
    lostToTitle: typeof entry.lostToTitle === "string" ? entry.lostToTitle : "another title",
  }));
}

export function parseSession(raw: string): StoredSession {
  const parsed = JSON.parse(raw) as StoredSession;
  if (parsed?.version !== 1 || !parsed.remainingIds || !Array.isArray(parsed.responses)) {
    throw new Error("Unrecognized session format");
  }
  const pending = parsed.pendingTourney;
  return {
    version: 1,
    medium: parsed.medium === "movie" || parsed.medium === "game" ? parsed.medium : null,
    playMode: parsePlayMode(parsed.playMode),
    remainingIds: {
      movie: Array.isArray(parsed.remainingIds.movie) ? parsed.remainingIds.movie : [],
      game: Array.isArray(parsed.remainingIds.game) ? parsed.remainingIds.game : [],
    },
    responses: parsed.responses.filter(
      (entry) =>
        entry &&
        typeof entry.id === "string" &&
        typeof entry.titleId === "string" &&
        typeof entry.title === "string" &&
        typeof entry.year === "number" &&
        (entry.kind === "rated" ||
          entry.kind === "skipped" ||
          entry.kind === "queued" ||
          entry.kind === "winner")
    ),
    discards: parseDiscards(parsed.discards),
    watchTags: parseWatchTags(parsed.watchTags),
    pendingTourney:
      pending && typeof pending.winnerId === "string" && typeof pending.loserId === "string"
        ? { winnerId: pending.winnerId, loserId: pending.loserId }
        : null,
    skipTourneyScoring: parsed.skipTourneyScoring === true,
    customTitles: parseCustomTitles(parsed.customTitles),
    pathFilters: parsePathFilters(parsed.pathFilters),
    recentlyShown: {
      movie: parseIdList(parsed.recentlyShown?.movie),
      game: parseIdList(parsed.recentlyShown?.game),
    },
    releaseYears: parseReleaseYears(parsed.releaseYears),
  };
}

function parseReleaseYears(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") return {};
  const next: Record<string, number> = {};
  for (const [id, year] of Object.entries(value as Record<string, unknown>)) {
    if (typeof year === "number" && Number.isFinite(year)) next[id] = year;
  }
  return next;
}

const listeners = new Set<() => void>();
let memory: StoredSession = EMPTY_SESSION;
let didHydrate = false;
let hydrateError: string | null = null;

function emit() {
  for (const listener of listeners) listener();
}

export function applyTourneyOutcome(
  prev: StoredSession,
  winnerId: string,
  loserId: string,
  extras?: { rating?: number; comments?: string }
): StoredSession {
  if (!prev.medium) return prev;
  const medium = prev.medium;
  const winner = resolveTitle(winnerId, prev.customTitles, prev.releaseYears);
  const loser = resolveTitle(loserId, prev.customTitles, prev.releaseYears);
  if (!winner || !loser) return prev;

  const now = new Date().toISOString();
  const scored = extras?.rating != null;
  const response: SessionResponse = {
    id: `${winner.id}-${Date.now()}`,
    titleId: winner.id,
    medium: winner.medium,
    title: winner.title,
    year: winner.year,
    kind: scored ? "rated" : "winner",
    rating: scored ? extras.rating : undefined,
    comments: extras?.comments?.trim() ? extras.comments.trim() : undefined,
    recordedAt: now,
  };

  const remaining = prev.remainingIds[medium].filter((id) => {
    if (id === winnerId || id === loserId) return false;
    const item = resolveTitle(id, prev.customTitles, prev.releaseYears);
    if (!item) return false;
    return matchesFilters(item, filtersFor(prev, medium, prev.playMode ?? "tourney"));
  });
  return {
    ...prev,
    pendingTourney: null,
    remainingIds: {
      ...prev.remainingIds,
      [medium]: remaining,
    },
    recentlyShown: {
      movie: prev.recentlyShown?.movie ?? [],
      game: prev.recentlyShown?.game ?? [],
      [medium]: rememberShown(prev, medium, remaining.slice(0, 2)),
    },
    responses: [...prev.responses, response],
    discards: [
      ...prev.discards,
      {
        id: `${loser.id}-${Date.now()}-discard`,
        titleId: loser.id,
        medium: loser.medium,
        title: loser.title,
        year: loser.year,
        lostToTitle: winner.title,
        recordedAt: now,
      },
    ],
  };
}

export function subscribeSession(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSessionSnapshot(): StoredSession {
  if (!didHydrate && typeof window !== "undefined") {
    didHydrate = true;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      memory = raw ? normalizeSession(parseSession(raw)) : EMPTY_SESSION;
      hydrateError = null;
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      memory = EMPTY_SESSION;
      hydrateError =
        "Your previous session could not be read, so we started a fresh stack. Nothing from this device was kept.";
    }
  }
  return memory;
}

export function getServerSessionSnapshot(): StoredSession {
  return EMPTY_SESSION;
}

export function getHydrateError(): string | null {
  return hydrateError;
}

export function writeSession(next: StoredSession) {
  memory = normalizeSession(next);
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  }
  emit();
}

export function normalizeSession(session: StoredSession): StoredSession {
  return {
    version: 1,
    medium: session.medium === "movie" || session.medium === "game" ? session.medium : null,
    playMode: parsePlayMode(session.playMode),
    remainingIds: {
      movie: Array.isArray(session.remainingIds?.movie) ? session.remainingIds.movie : [],
      game: Array.isArray(session.remainingIds?.game) ? session.remainingIds.game : [],
    },
    responses: Array.isArray(session.responses) ? session.responses : [],
    discards: Array.isArray(session.discards) ? session.discards : [],
    watchTags: Array.isArray(session.watchTags) ? session.watchTags : [],
    pendingTourney: session.pendingTourney ?? null,
    skipTourneyScoring: session.skipTourneyScoring === true,
    customTitles: Array.isArray(session.customTitles) ? session.customTitles : [],
    pathFilters: session.pathFilters ?? {},
    recentlyShown: {
      movie: parseIdList(session.recentlyShown?.movie),
      game: parseIdList(session.recentlyShown?.game),
    },
    releaseYears: parseReleaseYears(session.releaseYears),
  };
}

export function clearStoredSession() {
  memory = EMPTY_SESSION;
  hydrateError = null;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(memory));
  }
  emit();
}

export function dismissHydrateError() {
  hydrateError = null;
  emit();
}
