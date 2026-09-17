import { resolveTitle, titlesFor, withReleaseYear } from "@/data/catalog";
import { defaultFilters, decadesFor, matchesFilters, pathKey, sanitizeFilters } from "@/lib/filters";
import { parseMpaaList } from "@/lib/mpaa";
import type {
  CatalogTitle,
  DiscardEntry,
  FinalRound,
  Medium,
  PathFilters,
  PathKey,
  PlayMode,
  SessionResponse,
  StoredSession,
  TourneyUndoFrame,
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
  userQueue: [],
  queueOnly: false,
  pendingTourney: null,
  skipTourneyScoring: false,
  customTitles: [],
  pathFilters: {},
  recentlyShown: { movie: [], game: [] },
  releaseYears: {},
  liveTitles: [],
  finalRound: null,
  tourneyUndo: [],
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
  return sanitizeFilters(session.pathFilters[pathKey(medium, playMode)] ?? defaultFilters(medium), medium);
}

export function resultTitleIds(session: StoredSession, medium: Medium): Set<string> {
  const used = new Set<string>();
  for (const entry of session.responses) {
    if (entry.medium === medium) used.add(entry.titleId);
  }
  return used;
}

export function usedTitleIds(session: StoredSession, medium: Medium, playMode?: PlayMode): Set<string> {
  const used = resultTitleIds(session, medium);
  if (playMode === "rank") return used;
  for (const entry of session.discards) {
    if (entry.medium === medium) used.add(entry.titleId);
  }
  return used;
}

export function queuedForMedium(session: StoredSession, medium: Medium): CatalogTitle[] {
  return (session.userQueue ?? []).filter((item) => item.medium === medium);
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

export function skipTourneyPair(session: StoredSession): StoredSession {
  if (session.finalRound) {
    const ids = session.finalRound.remainingIds;
    if (ids.length < 2) return session;
    const pair = ids.slice(0, 2);
    const rest = ids.slice(2);
    return {
      ...session,
      pendingTourney: null,
      tourneyUndo: [],
      finalRound: { ...session.finalRound, remainingIds: shuffleIds([...rest, ...pair]) },
    };
  }
  if (!session.medium || session.playMode !== "tourney") return session;
  const pairIds = session.remainingIds[session.medium].slice(0, 2);
  if (pairIds.length === 0) return session;
  const marked: StoredSession = {
    ...session,
    pendingTourney: null,
    tourneyUndo: [],
    recentlyShown: {
      movie: session.recentlyShown?.movie ?? [],
      game: session.recentlyShown?.game ?? [],
      [session.medium]: rememberShown(session, session.medium, pairIds),
    },
  };
  return withDealtQueue(marked, session.medium, "tourney");
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
  const live = (session.liveTitles ?? []).filter((item) => item.medium === medium);
  const preset = titlesFor(medium);
  const primary = medium === "movie" ? (live.length > 0 ? live : preset) : [...preset, ...live];
  return [...primary, ...extras].map((item) => withReleaseYear(item, session.releaseYears));
}

const LIVE_TITLE_CAP = 240;

export function mergeLiveTitles(existing: CatalogTitle[], incoming: CatalogTitle[]): CatalogTitle[] {
  const next = new Map<string, CatalogTitle>();
  for (const item of incoming) next.set(item.id, item);
  for (const item of existing) {
    if (!next.has(item.id)) next.set(item.id, item);
  }
  return [...next.values()].slice(0, LIVE_TITLE_CAP);
}

export function eligibleFor(session: StoredSession, medium: Medium, playMode: PlayMode): CatalogTitle[] {
  if (session.queueOnly) {
    return queuedForMedium(session, medium);
  }
  const filters = filtersFor(session, medium, playMode);
  return catalogWithYears(session, medium).filter((item) => matchesFilters(item, filters));
}

export function poolFor(session: StoredSession, medium: Medium, playMode: PlayMode): CatalogTitle[] {
  const used = usedTitleIds(session, medium, playMode);
  return eligibleFor(session, medium, playMode).filter((item) => !used.has(item.id));
}

export function dealtQueue(
  session: StoredSession,
  medium: Medium,
  playMode: PlayMode,
  pinnedId?: string
): string[] {
  const used = usedTitleIds(session, medium, playMode);
  const pool = eligibleFor(session, medium, playMode).filter((item) => !used.has(item.id));
  const recent = new Set((session.recentlyShown?.[medium] ?? []).filter((id) => id !== pinnedId));
  const fresh = pool.filter((item) => item.id !== pinnedId && !recent.has(item.id));
  const stale = pool.filter((item) => item.id !== pinnedId && recent.has(item.id));
  const rest = [...shuffleIds(fresh.map((item) => item.id)), ...shuffleIds(stale.map((item) => item.id))];
  if (pinnedId && !used.has(pinnedId)) return [pinnedId, ...rest.filter((id) => id !== pinnedId)];
  return rest;
}

export function enqueueUserTitles(session: StoredSession, titles: CatalogTitle[]): StoredSession {
  let customTitles = [...(session.customTitles ?? [])];
  let userQueue = [...(session.userQueue ?? [])];
  for (const title of titles) {
    if (!customTitles.some((item) => item.id === title.id)) customTitles = [...customTitles, title];
    if (!userQueue.some((item) => item.id === title.id)) userQueue = [...userQueue, title];
  }
  let next: StoredSession = { ...session, customTitles, userQueue };
  if (next.queueOnly && next.medium && next.playMode && !next.finalRound) {
    next = withDealtQueue(next, next.medium, next.playMode);
  }
  return next;
}

export function removeQueuedTitle(session: StoredSession, titleId: string): StoredSession {
  let next: StoredSession = {
    ...session,
    userQueue: (session.userQueue ?? []).filter((item) => item.id !== titleId),
  };
  if (next.queueOnly && next.medium && next.playMode && !next.finalRound) {
    next = withDealtQueue(next, next.medium, next.playMode);
  }
  return next;
}

export function setQueueOnlyMode(session: StoredSession, queueOnly: boolean): StoredSession {
  let next: StoredSession = { ...session, queueOnly };
  if (next.medium && next.playMode && !next.finalRound) {
    next = withDealtQueue(next, next.medium, next.playMode);
  }
  return next;
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
    const medium = key.startsWith("movie") ? "movie" : "game";
    const allowedDecades = new Set(decadesFor(medium));
    const decades = Array.isArray(raw.decades)
      ? raw.decades.filter((n) => typeof n === "number" && allowedDecades.has(n))
      : [];
    next[key] = {
      decades: decades.length > 0 ? decades : [...decadesFor(medium)],
      genres: Array.isArray(raw.genres) ? raw.genres.filter((n) => typeof n === "string") : [],
      obscurity: Array.isArray(raw.obscurity)
        ? raw.obscurity.filter((n) => typeof n === "number")
        : [],
      mpaa: parseMpaaList(raw.mpaa, medium),
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
    ).map((entry) => ({
      ...entry,
      origin:
        entry.origin === "rank" || entry.origin === "tourney" || entry.origin === "final"
          ? entry.origin
          : undefined,
    })),
    discards: parseDiscards(parsed.discards),
    watchTags: parseWatchTags(parsed.watchTags),
    userQueue: parseCustomTitles(parsed.userQueue),
    queueOnly: parsed.queueOnly === true,
    pendingTourney:
      pending && typeof pending.winnerId === "string" && typeof pending.loserId === "string"
        ? { winnerId: pending.winnerId, loserId: pending.loserId }
        : null,
    skipTourneyScoring: parsed.skipTourneyScoring === true,
    customTitles: parseCustomTitles(parsed.customTitles),
    liveTitles: parseCustomTitles(parsed.liveTitles),
    pathFilters: parsePathFilters(parsed.pathFilters),
    recentlyShown: {
      movie: parseIdList(parsed.recentlyShown?.movie),
      game: parseIdList(parsed.recentlyShown?.game),
    },
    releaseYears: parseReleaseYears(parsed.releaseYears),
    finalRound: parseFinalRound(parsed.finalRound),
    tourneyUndo: parseTourneyUndo(parsed.tourneyUndo),
  };
}

function parseTourneyUndo(value: unknown): TourneyUndoFrame[] {
  if (!Array.isArray(value)) return [];
  const frames: TourneyUndoFrame[] = [];
  for (const item of value.slice(-3)) {
    if (!item || typeof item !== "object") continue;
    const frame = item as TourneyUndoFrame;
    if (!Array.isArray(frame.remainingIds) || !Array.isArray(frame.responses) || !Array.isArray(frame.discards)) {
      continue;
    }
    frames.push({
      remainingIds: frame.remainingIds.filter((id) => typeof id === "string"),
      finalRound: parseFinalRound(frame.finalRound),
      responses: frame.responses,
      discards: frame.discards,
      recentlyShown: {
        movie: parseIdList(frame.recentlyShown?.movie),
        game: parseIdList(frame.recentlyShown?.game),
      },
    });
  }
  return frames;
}

function parseFinalRound(value: unknown): FinalRound | null {
  if (!value || typeof value !== "object") return null;
  const round = value as FinalRound;
  if (round.medium !== "movie" && round.medium !== "game") return null;
  if (!Array.isArray(round.remainingIds)) return null;
  return { medium: round.medium, remainingIds: round.remainingIds.filter((id) => typeof id === "string") };
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

const UNDO_CAP = 3;

function captureTourneyUndo(session: StoredSession): TourneyUndoFrame {
  const medium = session.medium ?? "movie";
  return {
    remainingIds: [...(session.remainingIds[medium] ?? [])],
    finalRound: session.finalRound
      ? { medium: session.finalRound.medium, remainingIds: [...session.finalRound.remainingIds] }
      : null,
    responses: session.responses,
    discards: session.discards,
    recentlyShown: {
      movie: [...(session.recentlyShown?.movie ?? [])],
      game: [...(session.recentlyShown?.game ?? [])],
    },
  };
}

function withTourneyUndo(prev: StoredSession, next: StoredSession): StoredSession {
  return {
    ...next,
    tourneyUndo: [...(prev.tourneyUndo ?? []), captureTourneyUndo(prev)].slice(-UNDO_CAP),
  };
}

export function applyTourneyOutcome(
  prev: StoredSession,
  winnerId: string,
  loserId: string,
  extras?: { rating?: number; comments?: string }
): StoredSession {
  if (!prev.medium) return prev;
  const medium = prev.medium;
  const winner = resolveTitle(winnerId, prev.customTitles, prev.releaseYears, prev.liveTitles);
  const loser = resolveTitle(loserId, prev.customTitles, prev.releaseYears, prev.liveTitles);
  if (!winner || !loser) return prev;

  const now = new Date().toISOString();
  const scored = extras?.rating != null;
  const origin: SessionResponse["origin"] = prev.finalRound ? "final" : "tourney";
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
    origin,
  };

  if (prev.finalRound) {
    const remaining = prev.finalRound.remainingIds.filter((id) => id !== winnerId && id !== loserId);
    return withTourneyUndo(prev, {
      ...prev,
      pendingTourney: null,
      finalRound: {
        ...prev.finalRound,
        remainingIds: remaining.length === 0 ? [winnerId] : [...remaining, winnerId],
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
    });
  }

  const remaining = prev.remainingIds[medium].filter((id) => {
    if (id === winnerId || id === loserId) return false;
    const item = resolveTitle(id, prev.customTitles, prev.releaseYears, prev.liveTitles);
    if (!item) return false;
    return matchesFilters(item, filtersFor(prev, medium, prev.playMode ?? "tourney"));
  });
  return withTourneyUndo(prev, {
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
  });
}

export function undoTourneySelect(session: StoredSession): StoredSession {
  const stack = session.tourneyUndo ?? [];
  if (stack.length === 0 || !session.medium) return session;
  const frame = stack[stack.length - 1];
  const medium = session.medium;
  return {
    ...session,
    pendingTourney: null,
    remainingIds: session.finalRound || frame.finalRound
      ? session.remainingIds
      : { ...session.remainingIds, [medium]: frame.remainingIds },
    finalRound: frame.finalRound,
    responses: frame.responses,
    discards: frame.discards,
    recentlyShown: frame.recentlyShown,
    tourneyUndo: stack.slice(0, -1),
  };
}

export function tourneyContenderIds(session: StoredSession, medium: Medium): string[] {
  const ids: string[] = [];
  const seen = new Set<string>();
  for (const entry of session.responses) {
    if (entry.medium !== medium) continue;
    const fromTourney =
      entry.origin === "tourney" ||
      entry.origin === "final" ||
      entry.kind === "winner" ||
      (entry.kind === "rated" &&
        session.discards.some(
          (discard) => discard.medium === medium && discard.lostToTitle === entry.title
        ));
    if (!fromTourney) continue;
    if (seen.has(entry.titleId)) continue;
    seen.add(entry.titleId);
    ids.push(entry.titleId);
  }
  return ids;
}

export function startFinalRound(session: StoredSession): StoredSession {
  const medium =
    session.medium ??
    (tourneyContenderIds(session, "movie").length >= 2
      ? "movie"
      : tourneyContenderIds(session, "game").length >= 2
        ? "game"
        : null);
  if (!medium) return session;
  const ids = shuffleIds(tourneyContenderIds(session, medium));
  if (ids.length < 2) return session;
  return {
    ...session,
    medium,
    playMode: "tourney",
    pendingTourney: null,
    tourneyUndo: [],
    finalRound: { medium, remainingIds: ids },
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
    userQueue: Array.isArray(session.userQueue) ? session.userQueue : [],
    queueOnly: session.queueOnly === true,
    pendingTourney: session.pendingTourney ?? null,
    skipTourneyScoring: session.skipTourneyScoring === true,
    customTitles: Array.isArray(session.customTitles) ? session.customTitles : [],
    liveTitles: Array.isArray(session.liveTitles) ? session.liveTitles : [],
    pathFilters: parsePathFilters(session.pathFilters),
    recentlyShown: {
      movie: parseIdList(session.recentlyShown?.movie),
      game: parseIdList(session.recentlyShown?.game),
    },
    releaseYears: parseReleaseYears(session.releaseYears),
    finalRound: session.finalRound
      ? {
          medium: session.finalRound.medium,
          remainingIds: Array.isArray(session.finalRound.remainingIds)
            ? session.finalRound.remainingIds
            : [],
        }
      : null,
    tourneyUndo: Array.isArray(session.tourneyUndo) ? session.tourneyUndo.slice(-3) : [],
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
