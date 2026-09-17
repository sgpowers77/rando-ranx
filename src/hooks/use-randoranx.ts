"use client";

import { CATALOG_BY_ID } from "@/data/catalog";
import {
  clearStoredSession,
  dealtQueue,
  dismissHydrateError,
  getHydrateError,
  getServerSessionSnapshot,
  getSessionSnapshot,
  subscribeSession,
  usedTitleIds,
  writeSession,
} from "@/lib/session";
import type {
  CatalogTitle,
  Medium,
  PlayMode,
  SessionResponse,
  StoredSession,
} from "@/lib/types";
import { useCallback, useMemo, useSyncExternalStore } from "react";

function subscribeNoop() {
  return () => {};
}

function ensureQueue(prev: StoredSession, medium: Medium): string[] {
  const used = usedTitleIds(prev, medium);
  const remaining = prev.remainingIds[medium].filter((id) => !used.has(id));
  return remaining.length > 0 ? remaining : dealtQueue(medium, used);
}

export function useRandoRanx() {
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const session = useSyncExternalStore(
    subscribeSession,
    getSessionSnapshot,
    getServerSessionSnapshot
  );
  const errorMessage = useSyncExternalStore(subscribeSession, getHydrateError, () => null);

  const currentTitle = useMemo<CatalogTitle | null>(() => {
    if (!session.medium || session.playMode !== "rank") return null;
    const nextId = session.remainingIds[session.medium][0];
    return nextId ? (CATALOG_BY_ID.get(nextId) ?? null) : null;
  }, [session]);

  const tourneyPair = useMemo<[CatalogTitle, CatalogTitle] | null>(() => {
    if (!session.medium || session.playMode !== "tourney") return null;
    const queue = session.remainingIds[session.medium];
    const first = queue[0] ? CATALOG_BY_ID.get(queue[0]) : undefined;
    const second = queue[1] ? CATALOG_BY_ID.get(queue[1]) : undefined;
    return first && second ? [first, second] : null;
  }, [session]);

  const leftoverTitle = useMemo<CatalogTitle | null>(() => {
    if (!session.medium || session.playMode !== "tourney") return null;
    const queue = session.remainingIds[session.medium];
    if (queue.length !== 1) return null;
    return CATALOG_BY_ID.get(queue[0]) ?? null;
  }, [session]);

  const pendingWinner = useMemo<CatalogTitle | null>(() => {
    const pending = session.pendingTourney;
    if (!pending) return null;
    return CATALOG_BY_ID.get(pending.winnerId) ?? null;
  }, [session.pendingTourney]);

  const persist = useCallback((updater: (prev: StoredSession) => StoredSession) => {
    writeSession(updater(getSessionSnapshot()));
  }, []);

  const chooseMedium = useCallback(
    (medium: Medium) => {
      persist((prev) => ({
        ...prev,
        medium,
        playMode: null,
        pendingTourney: null,
        remainingIds: { ...prev.remainingIds, [medium]: ensureQueue(prev, medium) },
      }));
    },
    [persist]
  );

  const choosePlayMode = useCallback(
    (playMode: PlayMode) => {
      persist((prev) => {
        if (!prev.medium) return prev;
        return {
          ...prev,
          playMode,
          pendingTourney: null,
          remainingIds: { ...prev.remainingIds, [prev.medium]: ensureQueue(prev, prev.medium) },
        };
      });
    },
    [persist]
  );

  const goHome = useCallback(() => {
    persist((prev) => ({ ...prev, medium: null, playMode: null, pendingTourney: null }));
  }, [persist]);

  const goToModePick = useCallback(() => {
    persist((prev) => ({ ...prev, playMode: null, pendingTourney: null }));
  }, [persist]);

  const recordAndAdvance = useCallback(
    (kind: SessionResponse["kind"], extras?: { rating?: number; comments?: string }) => {
      persist((prev) => {
        if (!prev.medium) return prev;
        const [currentId, ...rest] = prev.remainingIds[prev.medium];
        const title = currentId ? CATALOG_BY_ID.get(currentId) : undefined;
        if (!title) return prev;

        const response: SessionResponse = {
          id: `${title.id}-${Date.now()}`,
          titleId: title.id,
          medium: title.medium,
          title: title.title,
          year: title.year,
          kind,
          rating: extras?.rating,
          comments: extras?.comments?.trim() ? extras.comments.trim() : undefined,
          recordedAt: new Date().toISOString(),
        };

        return {
          ...prev,
          remainingIds: { ...prev.remainingIds, [prev.medium]: rest },
          responses: [...prev.responses, response],
        };
      });
    },
    [persist]
  );

  const pickTourneyWinner = useCallback(
    (winnerId: string, loserId: string) => {
      persist((prev) => ({
        ...prev,
        pendingTourney: { winnerId, loserId },
      }));
    },
    [persist]
  );

  const cancelTourneyPick = useCallback(() => {
    persist((prev) => ({ ...prev, pendingTourney: null }));
  }, [persist]);

  const completeTourneyRound = useCallback(
    (rating: number, comments: string) => {
      persist((prev) => {
        if (!prev.medium || !prev.pendingTourney) return prev;
        const { winnerId, loserId } = prev.pendingTourney;
        const winner = CATALOG_BY_ID.get(winnerId);
        const loser = CATALOG_BY_ID.get(loserId);
        if (!winner || !loser) return prev;

        const now = new Date().toISOString();
        const response: SessionResponse = {
          id: `${winner.id}-${Date.now()}`,
          titleId: winner.id,
          medium: winner.medium,
          title: winner.title,
          year: winner.year,
          kind: "rated",
          rating,
          comments: comments.trim() ? comments.trim() : undefined,
          recordedAt: now,
        };

        return {
          ...prev,
          pendingTourney: null,
          remainingIds: {
            ...prev.remainingIds,
            [prev.medium]: prev.remainingIds[prev.medium].filter(
              (id) => id !== winnerId && id !== loserId
            ),
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
      });
    },
    [persist]
  );

  const reshuffleMedium = useCallback(() => {
    persist((prev) => {
      if (!prev.medium) return prev;
      return {
        ...prev,
        pendingTourney: null,
        remainingIds: {
          ...prev.remainingIds,
          [prev.medium]: dealtQueue(prev.medium, usedTitleIds(prev, prev.medium)),
        },
      };
    });
  }, [persist]);

  const updateResponse = useCallback(
    (id: string, kind: SessionResponse["kind"], extras?: { rating?: number; comments?: string }) => {
      persist((prev) => ({
        ...prev,
        responses: prev.responses.map((entry) => {
          if (entry.id !== id) return entry;
          const comments = extras?.comments?.trim() ? extras.comments.trim() : undefined;
          return {
            ...entry,
            kind,
            rating: kind === "rated" ? extras?.rating : undefined,
            comments,
          };
        }),
      }));
    },
    [persist]
  );

  const clearSession = useCallback(() => {
    clearStoredSession();
  }, []);

  return {
    session,
    status: mounted ? ("ready" as const) : ("loading" as const),
    errorMessage,
    currentTitle,
    tourneyPair,
    leftoverTitle,
    pendingWinner,
    chooseMedium,
    choosePlayMode,
    goHome,
    goToModePick,
    recordAndAdvance,
    pickTourneyWinner,
    cancelTourneyPick,
    completeTourneyRound,
    updateResponse,
    reshuffleMedium,
    clearSession,
    dismissError: dismissHydrateError,
  };
}
