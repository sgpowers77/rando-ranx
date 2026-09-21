import { resolveTitle, titlesFor, withReleaseYear } from "@/data/catalog";
import { defaultFilters, decadesFor, matchesFilters, ratingsFilterActive, buildUserScoreIndex, sanitizeFilters, stackSizeOf } from "@/lib/filters";
import { parseMpaaList } from "@/lib/mpaa";
import { parseWatchedDate } from "@/lib/director";
import { emptyFlagMap, emptyIdMap, isMedium, MEDIA } from "@/lib/medium";
import { pickDistinctTitles, titleIdentity, uniqueTitles } from "@/lib/title-identity";
import type {
  CatalogTitle,
  DiscardEntry,
  FinalRound,
  Medium,
  PathFilters,
  PlayMode,
  RatingExtras,
  SessionResponse,
  StoredSession,
  TourneyUndoFrame,
} from "@/lib/types";

export const STORAGE_KEY = "randoranx-session-v1";
const UNDO_CAP = 3;

export const EMPTY_SESSION: StoredSession = {
  version: 1,
  medium: null,
  playMode: null,
  remainingIds: emptyIdMap(),
  responses: [],
  discards: [],
  watchTags: [],
  userQueue: [],
  queueOnly: false,
  pendingTourney: null,
  skipTourneyScoring: false,
  customTitles: [],
  pathFilters: {},
  recentlyShown: emptyIdMap(),
  releaseYears: {},
  liveTitles: [],
  finalRounds: { movie: null, game: null, music: null },
  tourneyUndos: { movie: [], game: [], music: [] },
  randomizeFilters: emptyFlagMap(),
};

export function logsForMedium(session: StoredSession, medium: Medium | null) {
  if (!medium) {
    return {
      responses: [] as SessionResponse[],
      discards: [] as DiscardEntry[],
      watchTags: [] as StoredSession["watchTags"],
      userQueue: [] as CatalogTitle[],
    };
  }
  return {
    responses: session.responses.filter((entry) => entry.medium === medium),
    discards: session.discards.filter((entry) => entry.medium === medium),
    watchTags: session.watchTags.filter((tag) => tag.medium === medium),
    userQueue: queuedForMedium(session, medium),
  };
}

function shownMap(session: Pick<StoredSession, "recentlyShown"> | Partial<StoredSession>): Record<Medium, string[]> {
  return {
    movie: session.recentlyShown?.movie ?? [],
    game: session.recentlyShown?.game ?? [],
    music: session.recentlyShown?.music ?? [],
  };
}

function finalRoundsOf(session: Pick<StoredSession, "finalRounds"> | Partial<StoredSession>): Record<Medium, FinalRound | null> {
  return {
    movie: session.finalRounds?.movie ?? null,
    game: session.finalRounds?.game ?? null,
    music: session.finalRounds?.music ?? null,
  };
}

function tourneyUndosOf(session: Pick<StoredSession, "tourneyUndos"> | Partial<StoredSession>): Record<Medium, TourneyUndoFrame[]> {
  return {
    movie: session.tourneyUndos?.movie ?? [],
    game: session.tourneyUndos?.game ?? [],
    music: session.tourneyUndos?.music ?? [],
  };
}

export function activeFinalRound(session: StoredSession): FinalRound | null {
  if (!session.medium || session.playMode !== "tourney") return null;
  const round = finalRoundsOf(session)[session.medium];
  if (!round || round.medium !== session.medium) return null;
  return round;
}

function withMediumFinalRound(
  session: StoredSession,
  medium: Medium,
  round: FinalRound | null
): StoredSession {
  return {
    ...session,
    finalRounds: { ...finalRoundsOf(session), [medium]: round },
  };
}

function withMediumTourneyUndo(
  session: StoredSession,
  medium: Medium,
  stack: TourneyUndoFrame[]
): StoredSession {
  return {
    ...session,
    tourneyUndos: { ...tourneyUndosOf(session), [medium]: stack.slice(-UNDO_CAP) },
  };
}

export function shuffleIds(ids: string[]): string[] {
  const next = [...ids];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function lookupTitle(session: StoredSession, id: string): CatalogTitle | undefined {
  return resolveTitle(id, session.customTitles, session.releaseYears, session.liveTitles);
}

export function uniqueTitleIds(session: StoredSession, ids: string[]): string[] {
  const seenIds = new Set<string>();
  const seenKeys = new Set<string>();
  const next: string[] = [];
  for (const id of ids) {
    if (seenIds.has(id)) continue;
    const title = lookupTitle(session, id);
    const key = title ? titleIdentity(title) : `id:${id}`;
    if (seenKeys.has(key)) continue;
    seenIds.add(id);
    seenKeys.add(key);
    next.push(id);
  }
  return next;
}

/** Keep stack order, but put two distinct identities in the first two slots when possible. */
export function arrangeDistinctPair(session: StoredSession, ids: string[]): string[] {
  const unique = uniqueTitleIds(session, ids);
  if (unique.length < 2) return unique;
  const first = lookupTitle(session, unique[0]);
  if (!first) return unique;
  const swapAt = unique.findIndex((id, index) => {
    if (index === 0) return false;
    const title = lookupTitle(session, id);
    return title != null && titleIdentity(title) !== titleIdentity(first);
  });
  if (swapAt <= 1) return unique;
  return [unique[0], unique[swapAt], ...unique.slice(1, swapAt), ...unique.slice(swapAt + 1)];
}

export function filtersFor(session: StoredSession, medium: Medium, _playMode?: PlayMode): PathFilters {
  return sanitizeFilters(session.pathFilters[medium] ?? defaultFilters(medium), medium);
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
  return uniqueTitles((session.userQueue ?? []).filter((item) => item.medium === medium));
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

export function skipTourneyPair(session: StoredSession, replacements: CatalogTitle[] = []): StoredSession {
  const round = activeFinalRound(session);
  if (round && session.medium) {
    const ids = round.remainingIds;
    if (ids.length < 2) return session;
    const pair = ids.slice(0, 2);
    const rest = ids.slice(2);
    return withMediumFinalRound(
      { ...session, pendingTourney: null },
      session.medium,
      {
        ...round,
        remainingIds: arrangeDistinctPair(session, uniqueTitleIds(session, shuffleIds([...rest, ...pair]))),
      }
    );
  }
  if (!session.medium || session.playMode !== "tourney") return session;
  const medium = session.medium;
  const remaining = session.remainingIds[medium] ?? [];
  const pairIds = remaining.slice(0, 2);
  if (pairIds.length === 0) return session;
  const rest = remaining.slice(2);
  const parked = pairIds
    .map((id) => lookupTitle(session, id))
    .filter((item): item is CatalogTitle => item != null);
  const restTitles = rest
    .map((id) => lookupTitle(session, id))
    .filter((item): item is CatalogTitle => item != null);
  const extra = pickDistinctTitles(
    replacements.filter((item) => item.medium === medium),
    [...parked, ...restTitles],
    2
  );
  const extraIds = extra.map((item) => item.id);
  let nextRemaining =
    extraIds.length > 0
      ? [...extraIds, ...rest]
      : [...rest, ...pairIds.filter((id) => !rest.includes(id))];
  nextRemaining = arrangeDistinctPair(session, nextRemaining);
  if (nextRemaining.length < 2) {
    nextRemaining = arrangeDistinctPair(session, [
      ...nextRemaining,
      ...pairIds.filter((id) => !nextRemaining.includes(id)),
    ]);
  }
  const keepCap = Math.max(
    stackSizeOf(filtersFor(session, medium, "tourney").stackSize) * 4,
    extra.length + nextRemaining.length
  );
  return {
    ...session,
    pendingTourney: null,
    liveTitles: replaceLiveTitlesForMedium(
      session.liveTitles ?? [],
      extra,
      medium,
      keepCap,
      nextRemaining
    ),
    remainingIds: { ...session.remainingIds, [medium]: nextRemaining },
    recentlyShown: {
      ...shownMap(session),
      [medium]: rememberShown(session, medium, pairIds),
    },
  };
}

export function withDealtQueue(
  session: StoredSession,
  medium: Medium,
  playMode: PlayMode,
  pinnedId?: string
): StoredSession {
  const queue = arrangeDistinctPair(session, dealtQueue(session, medium, playMode, pinnedId));
  const shown = playMode === "tourney" ? queue.slice(0, 2) : queue.slice(0, 1);
  return {
    ...session,
    remainingIds: { ...session.remainingIds, [medium]: queue },
    recentlyShown: {
      ...shownMap(session),
      [medium]: rememberShown(session, medium, shown),
    },
  };
}

function catalogWithYears(session: StoredSession, medium: Medium): CatalogTitle[] {
  const extras = session.customTitles.filter((item) => item.medium === medium);
  const live = (session.liveTitles ?? []).filter((item) => item.medium === medium);
  const preset = titlesFor(medium);
  const primary = live.length > 0 ? live : preset;
  return uniqueTitles(
    [...primary, ...extras].map((item) => withReleaseYear(item, session.releaseYears))
  );
}

export function mergeLiveTitles(
  existing: CatalogTitle[],
  incoming: CatalogTitle[],
  cap = 50
): CatalogTitle[] {
  const next = new Map<string, CatalogTitle>();
  for (const item of incoming) next.set(item.id, item);
  for (const item of existing) {
    if (!next.has(item.id)) next.set(item.id, item);
  }
  return uniqueTitles([...next.values()]).slice(0, cap);
}

/** Replace one catalog’s live sample without dropping other media or ids still in the deal / undo stack. */
export function replaceLiveTitlesForMedium(
  existing: CatalogTitle[],
  incoming: CatalogTitle[],
  medium: Medium,
  cap: number,
  keepIds: Iterable<string> = []
): CatalogTitle[] {
  const keep = new Set(keepIds);
  const others = existing.filter((item) => item.medium !== medium);
  const sampled = uniqueTitles(incoming.filter((item) => item.medium === medium)).slice(
    0,
    Math.max(0, cap)
  );
  const sampledIds = new Set(sampled.map((item) => item.id));
  const retained = existing.filter(
    (item) => item.medium === medium && keep.has(item.id) && !sampledIds.has(item.id)
  );
  return uniqueTitles([...sampled, ...retained, ...others]);
}

export function eligibleFor(session: StoredSession, medium: Medium, playMode: PlayMode): CatalogTitle[] {
  if (session.queueOnly) {
    return queuedForMedium(session, medium);
  }
  const filters = filtersFor(session, medium, playMode);
  const scores = buildUserScoreIndex(session.responses, medium);
  return catalogWithYears(session, medium).filter((item) => matchesFilters(item, filters, { scores }));
}

export function poolFor(session: StoredSession, medium: Medium, playMode: PlayMode): CatalogTitle[] {
  const filters = filtersFor(session, medium, playMode);
  const scores = buildUserScoreIndex(session.responses, medium);
  const used = ratingsFilterActive(filters, scores) ? new Set<string>() : usedTitleIds(session, medium, playMode);
  return eligibleFor(session, medium, playMode).filter((item) => !used.has(item.id));
}

export function dealtQueue(
  session: StoredSession,
  medium: Medium,
  playMode: PlayMode,
  pinnedId?: string
): string[] {
  const filters = filtersFor(session, medium, playMode);
  const scores = buildUserScoreIndex(session.responses, medium);
  const used = ratingsFilterActive(filters, scores) ? new Set<string>() : usedTitleIds(session, medium, playMode);
  const pool = eligibleFor(session, medium, playMode).filter((item) => !used.has(item.id));
  const recent = new Set((session.recentlyShown?.[medium] ?? []).filter((id) => id !== pinnedId));
  const fresh = pool.filter((item) => item.id !== pinnedId && !recent.has(item.id));
  const stale = pool.filter((item) => item.id !== pinnedId && recent.has(item.id));
  const rest = uniqueTitleIds(session, [
    ...shuffleIds(fresh.map((item) => item.id)),
    ...shuffleIds(stale.map((item) => item.id)),
  ]);
  const ordered = pinnedId && !used.has(pinnedId) ? [pinnedId, ...rest.filter((id) => id !== pinnedId)] : rest;
  if (session.queueOnly) return arrangeDistinctPair(session, ordered);
  return arrangeDistinctPair(
    session,
    ordered.slice(0, stackSizeOf(filtersFor(session, medium, playMode).stackSize))
  );
}

export function enqueueUserTitles(session: StoredSession, titles: CatalogTitle[]): StoredSession {
  let customTitles = [...(session.customTitles ?? [])];
  let userQueue = [...(session.userQueue ?? [])];
  for (const title of titles) {
    if (!customTitles.some((item) => item.id === title.id)) customTitles = [...customTitles, title];
    if (!userQueue.some((item) => item.id === title.id)) userQueue = [...userQueue, title];
  }
  let next: StoredSession = { ...session, customTitles, userQueue };
  if (next.queueOnly && next.medium && next.playMode && !activeFinalRound(next)) {
    next = withDealtQueue(next, next.medium, next.playMode);
  }
  return next;
}

export function removeQueuedTitle(session: StoredSession, titleId: string): StoredSession {
  let next: StoredSession = {
    ...session,
    userQueue: (session.userQueue ?? []).filter((item) => item.id !== titleId),
  };
  if (next.queueOnly && next.medium && next.playMode && !activeFinalRound(next)) {
    next = withDealtQueue(next, next.medium, next.playMode);
  }
  return next;
}

export function setQueueOnlyMode(session: StoredSession, queueOnly: boolean): StoredSession {
  let next: StoredSession = { ...session, queueOnly };
  if (next.medium && next.playMode && !activeFinalRound(next)) {
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
    return isMedium(entry.medium);
  });
}

function parseCustomTitles(value: unknown): CatalogTitle[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is CatalogTitle => {
    if (!item || typeof item.id !== "string" || typeof item.title !== "string") return false;
    if (typeof item.year !== "number") return false;
    if (!isMedium(item.medium)) return false;
    if (!Array.isArray(item.genres)) return false;
    return [1, 2, 3, 4, 5].includes(item.obscurity);
  }).map((item) => ({
    ...item,
    director: typeof item.director === "string" && item.director.trim() ? item.director.trim() : undefined,
    artist: typeof item.artist === "string" && item.artist.trim() ? item.artist.trim() : undefined,
    musicbrainzId:
      typeof item.musicbrainzId === "string" && item.musicbrainzId.trim()
        ? item.musicbrainzId.trim()
        : undefined,
    platforms: Array.isArray(item.platforms)
      ? item.platforms.filter((platform): platform is string => typeof platform === "string")
      : undefined,
  }));
}

function parseRandomizeFlags(value: unknown): Record<Medium, boolean> {
  const data = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    movie: data.movie === true,
    game: data.game === true,
    music: data.music === true,
  };
}

function parseOnePathFilters(raw: unknown, medium: Medium): PathFilters | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as PathFilters;
  const allowedDecades = new Set(decadesFor(medium));
  const decades = Array.isArray(data.decades)
    ? data.decades.filter((n) => typeof n === "number" && allowedDecades.has(n))
    : [...decadesFor(medium)];
  return {
    decades,
    genres: Array.isArray(data.genres) ? data.genres.filter((n) => typeof n === "string") : [],
    obscurity: Array.isArray(data.obscurity)
      ? data.obscurity.filter((n) => typeof n === "number")
      : [],
    mpaa: parseMpaaList(data.mpaa, medium),
    includeForeign: data.includeForeign !== false,
    stackSize: stackSizeOf(typeof data.stackSize === "number" ? data.stackSize : undefined),
    platforms:
      medium === "game"
        ? Array.isArray(data.platforms)
          ? data.platforms.filter((item) => typeof item === "string")
          : []
        : [],
    scores: Array.isArray(data.scores)
      ? data.scores.filter((n) => typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 10)
      : [],
  };
}

function parsePathFilters(value: unknown): StoredSession["pathFilters"] {
  if (!value || typeof value !== "object") return {};
  const rec = value as Record<string, unknown>;
  const next: StoredSession["pathFilters"] = {};
  for (const medium of MEDIA) {
    const raw = rec[medium] ?? rec[`${medium}:rank`] ?? rec[`${medium}:tourney`];
    const parsed = parseOnePathFilters(raw, medium);
    if (parsed) next[medium] = parsed;
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
    return isMedium(entry.medium);
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
    medium: isMedium(parsed.medium) ? parsed.medium : null,
    playMode: parsePlayMode(parsed.playMode),
    remainingIds: {
      movie: Array.isArray(parsed.remainingIds.movie) ? parsed.remainingIds.movie : [],
      game: Array.isArray(parsed.remainingIds.game) ? parsed.remainingIds.game : [],
      music: Array.isArray(parsed.remainingIds.music) ? parsed.remainingIds.music : [],
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
      watchedDate: parseWatchedDate(entry.watchedDate),
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
      music: parseIdList(parsed.recentlyShown?.music),
    },
    releaseYears: parseReleaseYears(parsed.releaseYears),
    finalRounds: parseFinalRounds(parsed),
    tourneyUndos: parseTourneyUndos(parsed),
    randomizeFilters: parseRandomizeFlags(parsed.randomizeFilters),
  };
}

function parseFinalRounds(parsed: StoredSession): Record<Medium, FinalRound | null> {
  const next: Record<Medium, FinalRound | null> = { movie: null, game: null, music: null };
  const maps = (parsed as StoredSession & { finalRound?: FinalRound | null }).finalRounds;
  if (maps && typeof maps === "object") {
    next.movie = parseFinalRound(maps.movie);
    next.game = parseFinalRound(maps.game);
    next.music = parseFinalRound(maps.music);
  }
  const legacy = parseFinalRound((parsed as StoredSession & { finalRound?: unknown }).finalRound);
  if (legacy && !next[legacy.medium]) next[legacy.medium] = legacy;
  return next;
}

function parseTourneyUndos(parsed: StoredSession): Record<Medium, TourneyUndoFrame[]> {
  const next: Record<Medium, TourneyUndoFrame[]> = { movie: [], game: [], music: [] };
  const maps = parsed.tourneyUndos;
  if (maps && typeof maps === "object") {
    next.movie = parseTourneyUndo(maps.movie);
    next.game = parseTourneyUndo(maps.game);
    next.music = parseTourneyUndo(maps.music);
  }
  const legacy = parseTourneyUndo((parsed as StoredSession & { tourneyUndo?: unknown }).tourneyUndo);
  if (legacy.length > 0) {
    const fromRound = parseFinalRound((parsed as StoredSession & { finalRound?: unknown }).finalRound);
    const medium: Medium = isMedium(parsed.medium)
      ? parsed.medium
      : fromRound?.medium ?? "movie";
    if (next[medium].length === 0) next[medium] = legacy;
  }
  return next;
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
        music: parseIdList(frame.recentlyShown?.music),
      },
      liveTitles: parseCustomTitles(frame.liveTitles),
    });
  }
  return frames;
}

function parseFinalRound(value: unknown): FinalRound | null {
  if (!value || typeof value !== "object") return null;
  const round = value as FinalRound;
  if (!isMedium(round.medium)) return null;
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

function captureTourneyUndo(session: StoredSession): TourneyUndoFrame {
  const medium = session.medium ?? "movie";
  const round = finalRoundsOf(session)[medium];
  const logs = logsForMedium(session, medium);
  const remainingIds = [...(session.remainingIds[medium] ?? [])];
  const roundIds = round ? [...round.remainingIds] : [];
  const needed = new Set([...remainingIds, ...roundIds]);
  const liveForMedium = (session.liveTitles ?? []).filter((item) => item.medium === medium);
  const liveTitles = uniqueTitles([
    ...liveForMedium.filter((item) => needed.has(item.id)),
    ...liveForMedium,
  ]);
  return {
    remainingIds,
    finalRound: round ? { medium: round.medium, remainingIds: roundIds } : null,
    responses: logs.responses,
    discards: logs.discards,
    recentlyShown: shownMap({
      recentlyShown: {
        movie: medium === "movie" ? [...(session.recentlyShown?.movie ?? [])] : [],
        game: medium === "game" ? [...(session.recentlyShown?.game ?? [])] : [],
        music: medium === "music" ? [...(session.recentlyShown?.music ?? [])] : [],
      },
    }),
    liveTitles,
  };
}

function withTourneyUndo(prev: StoredSession, next: StoredSession): StoredSession {
  const medium = prev.medium;
  if (!medium) return next;
  return withMediumTourneyUndo(next, medium, [
    ...(tourneyUndosOf(prev)[medium] ?? []),
    captureTourneyUndo(prev),
  ]);
}

export function applyTourneyOutcome(
  prev: StoredSession,
  winnerId: string,
  loserId: string,
  extras?: RatingExtras
): StoredSession {
  if (!prev.medium) return prev;
  const medium = prev.medium;
  const winner = resolveTitle(winnerId, prev.customTitles, prev.releaseYears, prev.liveTitles);
  const loser = resolveTitle(loserId, prev.customTitles, prev.releaseYears, prev.liveTitles);
  if (!winner || !loser) return prev;

  const now = new Date().toISOString();
  const round = activeFinalRound(prev);
  const scored = extras?.rating != null;
  const origin: SessionResponse["origin"] = round ? "final" : "tourney";
  const response: SessionResponse = {
    id: `${winner.id}-${Date.now()}`,
    titleId: winner.id,
    medium: winner.medium,
    title: winner.title,
    year: winner.year,
    kind: scored ? "rated" : "winner",
    rating: scored ? extras.rating : undefined,
    comments: extras?.comments?.trim() ? extras.comments.trim() : undefined,
    watchedDate: parseWatchedDate(extras?.watchedDate),
    recordedAt: now,
    origin,
  };

  const discard: DiscardEntry = {
    id: `${loser.id}-${Date.now()}-discard`,
    titleId: loser.id,
    medium: loser.medium,
    title: loser.title,
    year: loser.year,
    lostToTitle: winner.title,
    recordedAt: now,
  };

  if (round) {
    const remaining = round.remainingIds.filter((id) => id !== winnerId && id !== loserId);
    return withTourneyUndo(
      prev,
      withMediumFinalRound(
        {
          ...prev,
          pendingTourney: null,
          responses: [...prev.responses, response],
          discards: [...prev.discards, discard],
        },
        medium,
        { ...round, remainingIds: remaining.length === 0 ? [winnerId] : arrangeDistinctPair(prev, uniqueTitleIds(prev, [...remaining, winnerId])) }
      )
    );
  }

  const remaining = arrangeDistinctPair(
    prev,
    uniqueTitleIds(
      prev,
      prev.remainingIds[medium].filter((id) => {
        if (id === winnerId || id === loserId) return false;
        const item = resolveTitle(id, prev.customTitles, prev.releaseYears, prev.liveTitles);
        if (!item) return true;
        return matchesFilters(item, filtersFor(prev, medium, prev.playMode ?? "tourney"), {
          scores: buildUserScoreIndex(prev.responses, medium),
        });
      })
    )
  );
  return withTourneyUndo(prev, {
    ...prev,
    pendingTourney: null,
    remainingIds: {
      ...prev.remainingIds,
      [medium]: remaining,
    },
    recentlyShown: {
      ...shownMap(prev),
      [medium]: rememberShown(prev, medium, remaining.slice(0, 2)),
    },
    responses: [...prev.responses, response],
    discards: [...prev.discards, discard],
  });
}

export function undoTourneySelect(session: StoredSession): StoredSession {
  if (!session.medium) return session;
  const medium = session.medium;
  const stack = tourneyUndosOf(session)[medium] ?? [];
  if (stack.length === 0) return session;
  const frame = stack[stack.length - 1];
  const liveTitles = uniqueTitles([
    ...(frame.liveTitles ?? []),
    ...(session.liveTitles ?? []),
  ]);
  const restored: StoredSession = {
    ...session,
    pendingTourney: null,
    liveTitles,
    remainingIds: {
      ...session.remainingIds,
      [medium]: [...frame.remainingIds],
    },
    responses: [
      ...session.responses.filter((entry) => entry.medium !== medium),
      ...frame.responses.filter((entry) => entry.medium === medium),
    ],
    discards: [
      ...session.discards.filter((entry) => entry.medium !== medium),
      ...frame.discards.filter((entry) => entry.medium === medium),
    ],
    recentlyShown: {
      ...shownMap(session),
      [medium]: frame.recentlyShown?.[medium] ?? session.recentlyShown?.[medium] ?? [],
    },
  };
  const restoredRound =
    frame.finalRound?.medium === medium
      ? {
          ...frame.finalRound,
          remainingIds: arrangeDistinctPair(
            restored,
            uniqueTitleIds(restored, frame.finalRound.remainingIds)
          ),
        }
      : null;
  const remaining = restoredRound
    ? restored.remainingIds
    : {
        ...restored.remainingIds,
        [medium]: arrangeDistinctPair(restored, uniqueTitleIds(restored, frame.remainingIds)),
      };
  return withMediumTourneyUndo(
    withMediumFinalRound(
      {
        ...restored,
        remainingIds: remaining,
      },
      medium,
      restoredRound
    ),
    medium,
    stack.slice(0, -1)
  );
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
    const title = lookupTitle(session, entry.titleId);
    const key = title ? titleIdentity(title) : entry.titleId;
    if (seen.has(entry.titleId) || seen.has(key)) continue;
    seen.add(entry.titleId);
    seen.add(key);
    ids.push(entry.titleId);
  }
  return ids;
}

/** Ratings, comments, watch dates, and Seen/Played results survive Return Home. */
export function isPersistentJournalEntry(entry: SessionResponse): boolean {
  if (entry.kind === "rated") return true;
  if (entry.rating != null) return true;
  if ((entry.comments ?? "").trim().length > 0) return true;
  if ((entry.watchedDate ?? "").trim().length > 0) return true;
  return false;
}

/**
 * Leaves the current catalog’s play session. Watch tags stay. Rated titles,
 * comments, and notes stay. Unscored Results (Contenders, skips, wants) and
 * Discard for that catalog are cleared. The other catalog is untouched.
 */
export function returnHomeClearingPlayLog(session: StoredSession, medium: Medium): StoredSession {
  const rounds = finalRoundsOf(session);
  const undos = tourneyUndosOf(session);
  return {
    ...session,
    medium: null,
    playMode: null,
    pendingTourney: session.medium === medium ? null : session.pendingTourney,
    remainingIds: { ...session.remainingIds, [medium]: [] },
    recentlyShown: {
      ...shownMap(session),
      [medium]: [],
    },
    responses: session.responses.filter(
      (entry) => entry.medium !== medium || isPersistentJournalEntry(entry)
    ),
    discards: session.discards.filter((entry) => entry.medium !== medium),
    finalRounds: { ...rounds, [medium]: null },
    tourneyUndos: { ...undos, [medium]: [] },
  };
}

export function startFinalRound(session: StoredSession): StoredSession {
  const medium = session.medium;
  if (!medium) return session;
  const ids = arrangeDistinctPair(
    session,
    uniqueTitleIds(session, shuffleIds(tourneyContenderIds(session, medium)))
  );
  if (ids.length < 2) return session;
  return withMediumTourneyUndo(
    withMediumFinalRound(
      {
        ...session,
        medium,
        playMode: "tourney",
        pendingTourney: null,
      },
      medium,
      { medium, remainingIds: ids }
    ),
    medium,
    []
  );
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
  const next: StoredSession = {
    version: 1,
    medium: isMedium(session.medium) ? session.medium : null,
    playMode: parsePlayMode(session.playMode),
    remainingIds: {
      movie: Array.isArray(session.remainingIds?.movie) ? session.remainingIds.movie : [],
      game: Array.isArray(session.remainingIds?.game) ? session.remainingIds.game : [],
      music: Array.isArray(session.remainingIds?.music) ? session.remainingIds.music : [],
    },
    responses: Array.isArray(session.responses) ? session.responses : [],
    discards: Array.isArray(session.discards) ? session.discards : [],
    watchTags: Array.isArray(session.watchTags) ? session.watchTags : [],
    userQueue: uniqueTitles(Array.isArray(session.userQueue) ? session.userQueue : []),
    queueOnly: session.queueOnly === true,
    pendingTourney: session.pendingTourney ?? null,
    skipTourneyScoring: session.skipTourneyScoring === true,
    customTitles: Array.isArray(session.customTitles) ? session.customTitles : [],
    liveTitles: uniqueTitles(Array.isArray(session.liveTitles) ? session.liveTitles : []),
    pathFilters: parsePathFilters(session.pathFilters),
    recentlyShown: {
      movie: parseIdList(session.recentlyShown?.movie),
      game: parseIdList(session.recentlyShown?.game),
      music: parseIdList(session.recentlyShown?.music),
    },
    releaseYears: parseReleaseYears(session.releaseYears),
    finalRounds: parseFinalRounds(session),
    tourneyUndos: parseTourneyUndos(session),
    randomizeFilters: parseRandomizeFlags(session.randomizeFilters),
  };
  const rounds = next.finalRounds;
  return {
    ...next,
    remainingIds: {
      movie: arrangeDistinctPair(next, uniqueTitleIds(next, next.remainingIds.movie)),
      game: arrangeDistinctPair(next, uniqueTitleIds(next, next.remainingIds.game)),
      music: arrangeDistinctPair(next, uniqueTitleIds(next, next.remainingIds.music)),
    },
    finalRounds: {
      movie: rounds.movie
        ? {
            ...rounds.movie,
            remainingIds: arrangeDistinctPair(next, uniqueTitleIds(next, rounds.movie.remainingIds)),
          }
        : null,
      game: rounds.game
        ? {
            ...rounds.game,
            remainingIds: arrangeDistinctPair(next, uniqueTitleIds(next, rounds.game.remainingIds)),
          }
        : null,
      music: rounds.music
        ? {
            ...rounds.music,
            remainingIds: arrangeDistinctPair(next, uniqueTitleIds(next, rounds.music.remainingIds)),
          }
        : null,
    },
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
