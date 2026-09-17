import { titlesFor } from "@/data/catalog";
import type { DiscardEntry, Medium, PlayMode, StoredSession } from "@/lib/types";

export const STORAGE_KEY = "randoranx-session-v1";

export const EMPTY_SESSION: StoredSession = {
  version: 1,
  medium: null,
  playMode: null,
  remainingIds: { movie: [], game: [] },
  responses: [],
  discards: [],
  pendingTourney: null,
};

export function shuffleIds(ids: string[]): string[] {
  const next = [...ids];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function dealtQueue(medium: Medium, used: Set<string>): string[] {
  const leftover = titlesFor(medium)
    .map((item) => item.id)
    .filter((id) => !used.has(id));
  return shuffleIds(leftover);
}

export function usedTitleIds(session: StoredSession, medium: Medium): Set<string> {
  const used = new Set<string>();
  for (const entry of session.responses) {
    if (entry.medium === medium) used.add(entry.titleId);
  }
  for (const entry of session.discards) {
    if (entry.medium === medium) used.add(entry.titleId);
  }
  return used;
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
        (entry.kind === "rated" || entry.kind === "skipped" || entry.kind === "queued")
    ),
    discards: parseDiscards(parsed.discards),
    pendingTourney:
      pending && typeof pending.winnerId === "string" && typeof pending.loserId === "string"
        ? { winnerId: pending.winnerId, loserId: pending.loserId }
        : null,
  };
}

const listeners = new Set<() => void>();
let memory: StoredSession = EMPTY_SESSION;
let didHydrate = false;
let hydrateError: string | null = null;

function emit() {
  for (const listener of listeners) listener();
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
      memory = raw ? parseSession(raw) : EMPTY_SESSION;
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
  memory = next;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  emit();
}

export function clearStoredSession() {
  memory = EMPTY_SESSION;
  hydrateError = null;
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(STORAGE_KEY);
  }
  emit();
}

export function dismissHydrateError() {
  hydrateError = null;
  emit();
}
