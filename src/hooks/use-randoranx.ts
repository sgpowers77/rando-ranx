"use client";

import { resolveTitle, titlesFor } from "@/data/catalog";
import { matchesFilters, pathKey } from "@/lib/filters";
import {
  applyTourneyOutcome,
  clearStoredSession,
  dismissHydrateError,
  eligibleFor,
  filtersFor,
  getHydrateError,
  getServerSessionSnapshot,
  getSessionSnapshot,
  rememberShown,
  subscribeSession,
  withDealtQueue,
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
import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";

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

  const visibleQueue = useMemo(() => {
    if (!session.medium || !session.playMode) return [];
    const filters = filtersFor(session, session.medium, session.playMode);
    return session.remainingIds[session.medium]
      .map((id) => resolveTitle(id, session.customTitles, session.releaseYears))
      .filter((title): title is CatalogTitle => title != null && matchesFilters(title, filters));
  }, [session]);

  const currentTitle = useMemo<CatalogTitle | null>(() => {
    if (session.playMode !== "rank") return null;
    return visibleQueue[0] ?? null;
  }, [session.playMode, visibleQueue]);

  const tourneyPair = useMemo<[CatalogTitle, CatalogTitle] | null>(() => {
    if (session.playMode !== "tourney") return null;
    const first = visibleQueue[0];
    const second = visibleQueue[1];
    return first && second ? [first, second] : null;
  }, [session.playMode, visibleQueue]);

  const leftoverTitle = useMemo<CatalogTitle | null>(() => {
    if (session.playMode !== "tourney") return null;
    if (visibleQueue.length !== 1) return null;
    return visibleQueue[0] ?? null;
  }, [session.playMode, visibleQueue]);

  const pendingWinner = useMemo<CatalogTitle | null>(() => {
    const pending = session.pendingTourney;
    if (!pending) return null;
    return resolveTitle(pending.winnerId, session.customTitles, session.releaseYears) ?? null;
  }, [session.customTitles, session.pendingTourney, session.releaseYears]);

  const persist = useCallback((updater: (prev: StoredSession) => StoredSession) => {
    writeSession(updater(getSessionSnapshot()));
  }, []);

  const syncingYears = useRef(false);

  const loadReleaseYears = useCallback(
    async (medium: Medium) => {
      const snapshot = getSessionSnapshot();
      const known = snapshot.releaseYears ?? {};
      const missing = titlesFor(medium).filter((item) => known[item.id] == null);
      if (missing.length === 0) return;
      if (syncingYears.current) return;
      syncingYears.current = true;
      try {
        const res = await fetch("/api/title-years", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            titles: missing.map((item) => ({
              id: item.id,
              title: item.title,
              medium: item.medium,
            })),
          }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { years?: Record<string, number> };
        const years = data.years ?? {};
        persist((prev) => {
          const next: StoredSession = {
            ...prev,
            releaseYears: { ...prev.releaseYears, ...years },
          };
          if (prev.medium === medium && prev.playMode) {
            return withDealtQueue({ ...next, pendingTourney: null }, medium, prev.playMode);
          }
          return next;
        });
      } catch {
        // Catalog years remain until Wikipedia answers.
      } finally {
        syncingYears.current = false;
      }
    },
    [persist]
  );

  useEffect(() => {
    if (!mounted || !session.medium) return;
    void loadReleaseYears(session.medium);
  }, [loadReleaseYears, mounted, session.medium]);

  const eligibleCount = useMemo(() => {
    if (!session.medium || !session.playMode) return 0;
    return eligibleFor(session, session.medium, session.playMode).length;
  }, [session]);

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
        return withDealtQueue(
          { ...prev, playMode, pendingTourney: null },
          prev.medium,
          playMode
        );
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
        if (!prev.medium || !prev.playMode) return prev;
        const filters = filtersFor(prev, prev.medium, prev.playMode);
        const matching = prev.remainingIds[prev.medium].filter((id) => {
          const item = resolveTitle(id, prev.customTitles, prev.releaseYears);
          return Boolean(item) && matchesFilters(item!, filters);
        });
        const currentId = matching[0];
        const title = currentId ? resolveTitle(currentId, prev.customTitles, prev.releaseYears) : undefined;
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

        const rest = matching.slice(1);
        return {
          ...prev,
          remainingIds: { ...prev.remainingIds, [prev.medium]: rest },
          recentlyShown: {
            movie: prev.recentlyShown?.movie ?? [],
            game: prev.recentlyShown?.game ?? [],
            [prev.medium]: rememberShown(prev, prev.medium, rest.slice(0, 1)),
          },
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
          return withDealtQueue(
            { ...next, pendingTourney: null },
            medium,
            playMode
          );
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
        return withDealtQueue(withTitle, prev.medium, playMode, title.id);
      });
    },
    [persist]
  );

  const addWatchTag = useCallback((title: CatalogTitle) => {
    persist((prev) => {
      if (prev.watchTags.some((tag) => tag.titleId === title.id)) return prev;
      return {
        ...prev,
        watchTags: [
          ...prev.watchTags,
          {
            titleId: title.id,
            medium: title.medium,
            title: title.title,
            year: title.year,
            taggedAt: new Date().toISOString(),
          },
        ],
      };
    });
  }, [persist]);

  const reshuffleMedium = useCallback(() => {
    persist((prev) => {
      if (!prev.medium || !prev.playMode) return prev;
      return withDealtQueue(
        { ...prev, pendingTourney: null },
        prev.medium,
        prev.playMode
      );
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
    eligibleCount,
    remainingVisible: visibleQueue.length,
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
    addWatchTag,
    updateResponse,
    reshuffleMedium,
    clearSession,
    dismissError: dismissHydrateError,
  };
}
