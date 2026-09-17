"use client";

import { resolveTitle } from "@/data/catalog";
import { pathKey } from "@/lib/filters";
import {
  applyTourneyOutcome,
  clearStoredSession,
  dealtQueue,
  dismissHydrateError,
  ensureQueue,
  getHydrateError,
  getServerSessionSnapshot,
  getSessionSnapshot,
  subscribeSession,
  writeSession,
} from "@/lib/session";
import type {
  CatalogTitle,
  Medium,
  PathFilters,
  PlayMode,
  SessionResponse,
  StoredSession,
} from "@/lib/types";
import { useCallback, useMemo, useSyncExternalStore } from "react";

function subscribeNoop() {
  return () => {};
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
    return nextId ? (resolveTitle(nextId, session.customTitles) ?? null) : null;
  }, [session]);

  const tourneyPair = useMemo<[CatalogTitle, CatalogTitle] | null>(() => {
    if (!session.medium || session.playMode !== "tourney") return null;
    const queue = session.remainingIds[session.medium];
    const first = queue[0] ? resolveTitle(queue[0], session.customTitles) : undefined;
    const second = queue[1] ? resolveTitle(queue[1], session.customTitles) : undefined;
    return first && second ? [first, second] : null;
  }, [session]);

  const leftoverTitle = useMemo<CatalogTitle | null>(() => {
    if (!session.medium || session.playMode !== "tourney") return null;
    const queue = session.remainingIds[session.medium];
    if (queue.length !== 1) return null;
    return resolveTitle(queue[0], session.customTitles) ?? null;
  }, [session]);

  const pendingWinner = useMemo<CatalogTitle | null>(() => {
    const pending = session.pendingTourney;
    if (!pending) return null;
    return resolveTitle(pending.winnerId, session.customTitles) ?? null;
  }, [session.customTitles, session.pendingTourney]);

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
          remainingIds: {
            ...prev.remainingIds,
            [prev.medium]: ensureQueue(prev, prev.medium, playMode),
          },
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
        const title = currentId ? resolveTitle(currentId, prev.customTitles) : undefined;
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
      persist((prev) => {
        if (prev.skipTourneyScoring) {
          return applyTourneyOutcome(prev, winnerId, loserId);
        }
        return {
          ...prev,
          pendingTourney: { winnerId, loserId },
        };
      });
    },
    [persist]
  );

  const cancelTourneyPick = useCallback(() => {
    persist((prev) => ({ ...prev, pendingTourney: null }));
  }, [persist]);

  const completeTourneyRound = useCallback(
    (extras?: { rating?: number; comments?: string }) => {
      persist((prev) => {
        if (!prev.pendingTourney) return prev;
        return applyTourneyOutcome(
          prev,
          prev.pendingTourney.winnerId,
          prev.pendingTourney.loserId,
          extras
        );
      });
    },
    [persist]
  );

  const setSkipTourneyScoring = useCallback(
    (skipTourneyScoring: boolean) => {
      persist((prev) => ({ ...prev, skipTourneyScoring }));
    },
    [persist]
  );

  const savePathFilters = useCallback(
    (medium: Medium, playMode: PlayMode, filters: PathFilters) => {
      persist((prev) => {
        const next: StoredSession = {
          ...prev,
          pathFilters: { ...prev.pathFilters, [pathKey(medium, playMode)]: filters },
        };
        if (prev.medium === medium && prev.playMode === playMode) {
          next.pendingTourney = null;
          next.remainingIds = {
            ...prev.remainingIds,
            [medium]: dealtQueue(next, medium, playMode),
          };
        }
        return next;
      });
    },
    [persist]
  );

  const useSearchedTitle = useCallback(
    (title: CatalogTitle, playMode: PlayMode) => {
      persist((prev) => {
        if (!prev.medium) return prev;
        const customTitles = prev.customTitles.some((item) => item.id === title.id)
          ? prev.customTitles
          : [...prev.customTitles, title];
        const withTitle: StoredSession = { ...prev, customTitles, playMode, pendingTourney: null };
        const rest = ensureQueue(withTitle, prev.medium, playMode).filter((id) => id !== title.id);
        return {
          ...withTitle,
          remainingIds: {
            ...prev.remainingIds,
            [prev.medium]: [title.id, ...rest],
          },
        };
      });
    },
    [persist]
  );

  const reshuffleMedium = useCallback(() => {
    persist((prev) => {
      if (!prev.medium || !prev.playMode) return prev;
      return {
        ...prev,
        pendingTourney: null,
        remainingIds: {
          ...prev.remainingIds,
          [prev.medium]: dealtQueue(prev, prev.medium, prev.playMode),
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
    setSkipTourneyScoring,
    savePathFilters,
    useSearchedTitle,
    updateResponse,
    reshuffleMedium,
    clearSession,
    dismissError: dismissHydrateError,
  };
}
