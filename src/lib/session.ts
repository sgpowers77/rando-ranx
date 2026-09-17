import { titlesFor } from "@/data/catalog";
import type { Medium, StoredSession } from "@/lib/types";

export const STORAGE_KEY = "randoranx-session-v1";

export const EMPTY_SESSION: StoredSession = {
  version: 1,
  medium: null,
  remainingIds: { movie: [], game: [] },
  responses: [],
};

export function shuffleIds(ids: string[]): string[] {
  const next = [...ids];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

export function dealtQueue(medium: Medium, usedTitleIds: Set<string>): string[] {
  const leftover = titlesFor(medium)
    .map((item) => item.id)
    .filter((id) => !usedTitleIds.has(id));
  return shuffleIds(leftover);
}

export function usedTitleIds(session: StoredSession, medium: Medium): Set<string> {
  return new Set(
    session.responses.filter((entry) => entry.medium === medium).map((entry) => entry.titleId)
  );
}

export function parseSession(raw: string): StoredSession {
  const parsed = JSON.parse(raw) as StoredSession;
  if (parsed?.version !== 1 || !parsed.remainingIds || !Array.isArray(parsed.responses)) {
    throw new Error("Unrecognized session format");
  }
  return {
    version: 1,
    medium: parsed.medium === "movie" || parsed.medium === "game" ? parsed.medium : null,
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
      hydrateError = "Your previous session could not be read, so we started a fresh stack. Nothing from this device was kept.";
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
