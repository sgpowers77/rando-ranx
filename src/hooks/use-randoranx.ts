"use client";

import { resolveTitle } from "@/data/catalog";
import { loadGameCatalog, loadMovieCatalog, sampleClientPool } from "@/lib/client-pool";
import { matchesFilters, randomizeFilters as rollPathFilters, stackSizeOf } from "@/lib/filters";
import { distinctTourneyPair, pickDistinctTitles, uniqueTitles } from "@/lib/title-identity";
import { preloadPosterStack } from "@/lib/poster";
import {
  applyTourneyOutcome,
  clearStoredSession,
  dismissHydrateError,
  activeFinalRound,
  eligibleFor,
  enqueueUserTitles,
  filtersFor,
  getHydrateError,
  getServerSessionSnapshot,
  getSessionSnapshot,
  mergeLiveTitles,
  rememberShown,
  removeQueuedTitle,
  setQueueOnlyMode,
  skipTourneyPair,
  returnHomeClearingPlayLog,
  startFinalRound,
  subscribeSession,
  tourneyContenderIds,
  undoTourneySelect,
  usedTitleIds,
  withDealtQueue,
  writeSession,
} from "@/lib/session";
import type {
  CatalogTitle,
  Medium,
  PathFilters,
  PlayMode,
  RatingExtras,
  SessionResponse,
  StoredSession,
} from "@/lib/types";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

function subscribeNoop() {
  return () => {};
}

function titleLookup(session: StoredSession, id: string) {
  return resolveTitle(id, session.customTitles, session.releaseYears, session.liveTitles);
}

export function useRandoRanx() {
  const mounted = useSyncExternalStore(subscribeNoop, () => true, () => false);
  const session = useSyncExternalStore(
    subscribeSession,
    getSessionSnapshot,
    getServerSessionSnapshot
  );
  const errorMessage = useSyncExternalStore(subscribeSession, getHydrateError, () => null);
  const [poolStatus, setPoolStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [poolError, setPoolError] = useState<string | null>(null);
  const [poolSource, setPoolSource] = useState<"dataset" | "catalog" | "none">("none");
  const fetching = useRef(false);
  const skippingPair = useRef(false);

  const visibleQueue = useMemo(() => {
    if (!session.medium || !session.playMode) return [];
    const round = activeFinalRound(session);
    if (round) {
      return round.remainingIds
        .map((id) => titleLookup(session, id))
        .filter((title): title is CatalogTitle => title != null);
    }
    if (session.queueOnly) {
      const used = usedTitleIds(session, session.medium, session.playMode);
      return session.remainingIds[session.medium]
        .map((id) => titleLookup(session, id))
        .filter((title): title is CatalogTitle => title != null && !used.has(title.id));
    }
    const filters = filtersFor(session, session.medium, session.playMode);
    const used = usedTitleIds(session, session.medium, session.playMode);
    return session.remainingIds[session.medium]
      .map((id) => titleLookup(session, id))
      .filter(
        (title): title is CatalogTitle =>
          title != null && matchesFilters(title, filters) && !used.has(title.id)
      );
  }, [session]);

  const currentTitle = useMemo<CatalogTitle | null>(() => {
    if (session.playMode !== "rank") return null;
    return visibleQueue[0] ?? null;
  }, [session.playMode, visibleQueue]);

  const tourneyPair = useMemo<[CatalogTitle, CatalogTitle] | null>(() => {
    if (session.playMode !== "tourney") return null;
    return distinctTourneyPair(visibleQueue);
  }, [session.playMode, visibleQueue]);

  const leftoverTitle = useMemo<CatalogTitle | null>(() => {
    if (session.playMode !== "tourney") return null;
    if (distinctTourneyPair(visibleQueue)) return null;
    const unique = uniqueTitles(visibleQueue);
    return unique.length === 1 ? unique[0] ?? null : null;
  }, [session.playMode, visibleQueue]);

  useEffect(() => {
    if (visibleQueue.length === 0) return;
    void preloadPosterStack(visibleQueue);
  }, [visibleQueue]);

  const pendingWinner = useMemo<CatalogTitle | null>(() => {
    const pending = session.pendingTourney;
    if (!pending) return null;
    return titleLookup(session, pending.winnerId) ?? null;
  }, [session]);

  const persist = useCallback((updater: (prev: StoredSession) => StoredSession) => {
    writeSession(updater(getSessionSnapshot()));
  }, []);

  const refreshPool = useCallback(async (opts?: { silent?: boolean }) => {
    const snapshot = getSessionSnapshot();
    if (!snapshot.medium || !snapshot.playMode || fetching.current) return;
    if (snapshot.queueOnly) {
      persist((prev) => {
        if (!prev.medium || !prev.playMode || activeFinalRound(prev)) return prev;
        return withDealtQueue(prev, prev.medium, prev.playMode);
      });
      setPoolStatus("ready");
      setPoolSource("catalog");
      setPoolError(null);
      return;
    }
    fetching.current = true;
    if (!opts?.silent) {
      setPoolStatus("loading");
      setPoolError(null);
    }
    try {
      const filters = filtersFor(snapshot, snapshot.medium, snapshot.playMode);
      const recent = snapshot.recentlyShown?.[snapshot.medium] ?? [];
      const data = await sampleClientPool({
        medium: snapshot.medium,
        filters,
        excludeIds: [...usedTitleIds(snapshot, snapshot.medium, snapshot.playMode), ...recent],
        limit: stackSizeOf(filters.stackSize),
      });
      const titles = data.titles;
      setPoolSource(data.source);
      persist((prev) => {
        if (!prev.medium || !prev.playMode) return prev;
        const liveTitles = mergeLiveTitles(
          prev.liveTitles ?? [],
          titles,
          stackSizeOf(filtersFor(prev, prev.medium, prev.playMode).stackSize)
        );
        const inFinal = Boolean(activeFinalRound(prev));
        const next: StoredSession = { ...prev, liveTitles, pendingTourney: inFinal ? prev.pendingTourney : null };
        if (inFinal) return next;
        if (
          opts?.silent &&
          prev.playMode === "tourney" &&
          (prev.remainingIds[prev.medium]?.length ?? 0) >= 2
        ) {
          return next;
        }
        return withDealtQueue(next, prev.medium, prev.playMode);
      });
      setPoolStatus("ready");
      if (data.source === "catalog" && snapshot.medium === "movie") {
        setPoolError(null);
      }
    } catch {
      persist((prev) => {
        if (!prev.medium || !prev.playMode) return prev;
        return withDealtQueue({ ...prev, pendingTourney: null }, prev.medium, prev.playMode);
      });
      setPoolStatus("error");
      setPoolError("Could not reach the title pool. Using a local fallback if anything is available.");
      setPoolSource("catalog");
    } finally {
      fetching.current = false;
    }
  }, [persist]);

  useEffect(() => {
    if (!mounted) return;
    if (session.medium === "movie") void loadMovieCatalog();
    if (session.medium === "game") void loadGameCatalog();
  }, [mounted, session.medium]);

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
      setPoolStatus("idle");
      setPoolError(null);
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
          remainingIds: { ...prev.remainingIds, [prev.medium]: [] },
        };
      });
      void refreshPool();
    },
    [persist, refreshPool]
  );

  const goHome = useCallback(() => {
    persist((prev) => ({ ...prev, medium: null, playMode: null, pendingTourney: null }));
    setPoolStatus("idle");
  }, [persist]);

  const returnHomeFromPlay = useCallback(() => {
    persist((prev) => {
      if (!prev.medium) {
        return { ...prev, medium: null, playMode: null, pendingTourney: null };
      }
      return returnHomeClearingPlayLog(prev, prev.medium);
    });
    setPoolStatus("idle");
    setPoolError(null);
  }, [persist]);

  const goToModePick = useCallback(() => {
    persist((prev) => ({ ...prev, playMode: null, pendingTourney: null }));
  }, [persist]);

  const recordAndAdvance = useCallback(
    (kind: SessionResponse["kind"], extras?: RatingExtras) => {
      persist((prev) => {
        if (!prev.medium || !prev.playMode) return prev;
        const filters = filtersFor(prev, prev.medium, prev.playMode);
        const matching = prev.remainingIds[prev.medium].filter((id) => {
          const item = titleLookup(prev, id);
          return Boolean(item) && matchesFilters(item!, filters);
        });
        const currentId = matching[0];
        const title = currentId ? titleLookup(prev, currentId) : undefined;
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
          watchedDate: extras?.watchedDate,
          recordedAt: new Date().toISOString(),
          origin: "rank",
        };

        const used = new Set(
          prev.responses.filter((entry) => entry.medium === prev.medium).map((entry) => entry.titleId)
        );
        used.add(title.id);
        const rest = matching.slice(1).filter((id) => !used.has(id));
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
    (winnerId: string, loserId: string, extras?: RatingExtras) => {
      persist((prev) => applyTourneyOutcome(prev, winnerId, loserId, extras));
    },
    [persist]
  );

  useEffect(() => {
    if (!session.pendingTourney) return;
    persist((prev) => {
      if (!prev.pendingTourney) return prev;
      return applyTourneyOutcome(prev, prev.pendingTourney.winnerId, prev.pendingTourney.loserId);
    });
  }, [persist, session.pendingTourney]);

  const cancelTourneyPick = useCallback(() => {
    persist((prev) => ({ ...prev, pendingTourney: null }));
  }, [persist]);

  const completeTourneyRound = useCallback(
    (extras?: RatingExtras) => {
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
    (medium: Medium, filters: PathFilters) => {
      persist((prev) => ({
        ...prev,
        pathFilters: { ...prev.pathFilters, [medium]: filters },
        randomizeFilters: {
          movie: prev.randomizeFilters?.movie === true,
          game: prev.randomizeFilters?.game === true,
          [medium]: false,
        },
      }));
      const snap = getSessionSnapshot();
      if (snap.medium === medium && snap.playMode) {
        void refreshPool();
      }
    },
    [persist, refreshPool]
  );

  const setRandomizeFilters = useCallback(
    (medium: Medium, on: boolean) => {
      persist((prev) => {
        const flags = {
          movie: prev.randomizeFilters?.movie === true,
          game: prev.randomizeFilters?.game === true,
          [medium]: on,
        };
        if (!on) return { ...prev, randomizeFilters: flags };
        return {
          ...prev,
          randomizeFilters: flags,
          pathFilters: { ...prev.pathFilters, [medium]: rollPathFilters(medium) },
        };
      });
      const snap = getSessionSnapshot();
      if (on && snap.medium === medium && snap.playMode) {
        void refreshPool();
      }
    },
    [persist, refreshPool]
  );

  const queueSearchedTitles = useCallback(
    (titles: CatalogTitle[]) => {
      persist((prev) => enqueueUserTitles(prev, titles));
    },
    [persist]
  );

  const removeFromUserQueue = useCallback((titleId: string) => {
    persist((prev) => removeQueuedTitle(prev, titleId));
  }, [persist]);

  const setPresentQueuedOnly = useCallback(
    (queueOnly: boolean) => {
      persist((prev) => setQueueOnlyMode(prev, queueOnly));
      const snap = getSessionSnapshot();
      if (snap.medium && snap.playMode && !queueOnly) {
        void refreshPool();
      }
    },
    [persist, refreshPool]
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

  const toggleWatchTag = useCallback((title: CatalogTitle) => {
    persist((prev) => {
      if (prev.watchTags.some((tag) => tag.titleId === title.id)) {
        return { ...prev, watchTags: prev.watchTags.filter((tag) => tag.titleId !== title.id) };
      }
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

  const skipTourneyMatchup = useCallback(() => {
    const snapshot = getSessionSnapshot();
    if (!snapshot.medium || snapshot.playMode !== "tourney") return;
    if (activeFinalRound(snapshot)) {
      persist((prev) => skipTourneyPair(prev));
      return;
    }
    if (skippingPair.current) return;
    const medium = snapshot.medium;
    const remaining = snapshot.remainingIds[medium] ?? [];
    const pairIds = remaining.slice(0, 2);
    if (pairIds.length < 2) return;
    skippingPair.current = true;
    const remainingTitles = remaining
      .map((id) => titleLookup(snapshot, id))
      .filter((item): item is CatalogTitle => item != null);
    const exclude = new Set([
      ...usedTitleIds(snapshot, medium, "tourney"),
      ...remaining,
      ...(snapshot.recentlyShown?.[medium] ?? []),
    ]);
    void (async () => {
      try {
        let extras: CatalogTitle[] = [];
        if (!snapshot.queueOnly) {
          const data = await sampleClientPool({
            medium,
            filters: filtersFor(snapshot, medium, "tourney"),
            excludeIds: [...exclude],
            count: 8,
          });
          extras = pickDistinctTitles(data.titles, remainingTitles, 2);
        }
        persist((prev) => {
          if (!prev.medium || prev.playMode !== "tourney" || activeFinalRound(prev)) return prev;
          const currentPair = (prev.remainingIds[prev.medium] ?? []).slice(0, 2);
          if (currentPair.length < 2) return prev;
          if (currentPair[0] !== pairIds[0] || currentPair[1] !== pairIds[1]) return prev;
          return skipTourneyPair(prev, extras);
        });
      } catch {
        persist((prev) => skipTourneyPair(prev, []));
      } finally {
        skippingPair.current = false;
      }
    })();
  }, [persist]);

  const beginFinalRound = useCallback(() => {
    persist((prev) => startFinalRound(prev));
  }, [persist]);

  const undoTourneyPick = useCallback(() => {
    persist((prev) => undoTourneySelect(prev));
  }, [persist]);

  const reshuffleMedium = useCallback(() => {
    void refreshPool();
  }, [refreshPool]);

  const updateResponse = useCallback(
    (id: string, kind: SessionResponse["kind"], extras?: RatingExtras) => {
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
            watchedDate:
              kind === "rated" || kind === "winner" ? extras?.watchedDate : undefined,
          };
        }),
      }));
    },
    [persist]
  );

  const clearSession = useCallback(() => {
    clearStoredSession();
    setPoolStatus("idle");
    setPoolError(null);
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
    poolStatus,
    poolError,
    poolSource,
    finalRoundActive: Boolean(activeFinalRound(session)),
    tourneyUndoCount: session.medium ? (session.tourneyUndos?.[session.medium]?.length ?? 0) : 0,
    contenderCount: session.medium ? tourneyContenderIds(session, session.medium).length : 0,
    chooseMedium,
    choosePlayMode,
    goHome,
    returnHomeFromPlay,
    goToModePick,
    recordAndAdvance,
    pickTourneyWinner,
    cancelTourneyPick,
    completeTourneyRound,
    setSkipTourneyScoring,
    savePathFilters,
    setRandomizeFilters,
    queueSearchedTitles,
    removeFromUserQueue,
    setPresentQueuedOnly,
    addWatchTag,
    toggleWatchTag,
    updateResponse,
    reshuffleMedium,
    skipTourneyMatchup,
    undoTourneyPick,
    beginFinalRound,
    clearSession,
    dismissError: dismissHydrateError,
  };
}
