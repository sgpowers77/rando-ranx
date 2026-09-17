"use client";

import { resolveTitle } from "@/data/catalog";
import { loadMovieCatalog, sampleClientPool } from "@/lib/client-pool";
import { matchesFilters, pathKey } from "@/lib/filters";
import {
  applyTourneyOutcome,
  clearStoredSession,
  dismissHydrateError,
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

  const visibleQueue = useMemo(() => {
    if (!session.medium || !session.playMode) return [];
    if (session.finalRound) {
      return session.finalRound.remainingIds
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
        if (!prev.medium || !prev.playMode || prev.finalRound) return prev;
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
        limit: snapshot.playMode === "tourney" ? 40 : 36,
      });
      const titles = data.titles;
      setPoolSource(data.source);
      persist((prev) => {
        if (!prev.medium || !prev.playMode) return prev;
        const liveTitles = mergeLiveTitles(prev.liveTitles ?? [], titles);
        const next: StoredSession = { ...prev, liveTitles, pendingTourney: prev.finalRound ? prev.pendingTourney : null };
        if (prev.finalRound) return next;
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
    if (!mounted || session.medium !== "movie") return;
    void loadMovieCatalog();
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
        finalRound: null,
        tourneyUndo: [],
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
          finalRound: null,
          tourneyUndo: [],
          remainingIds: { ...prev.remainingIds, [prev.medium]: [] },
        };
      });
      void refreshPool();
    },
    [persist, refreshPool]
  );

  const goHome = useCallback(() => {
    persist((prev) => ({ ...prev, medium: null, playMode: null, pendingTourney: null, finalRound: null, tourneyUndo: [] }));
    setPoolStatus("idle");
  }, [persist]);

  const goToModePick = useCallback(() => {
    persist((prev) => ({ ...prev, playMode: null, pendingTourney: null, finalRound: null, tourneyUndo: [] }));
  }, [persist]);

  const recordAndAdvance = useCallback(
    (kind: SessionResponse["kind"], extras?: { rating?: number; comments?: string }) => {
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
    (winnerId: string, loserId: string, extras?: { rating?: number; comments?: string }) => {
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
      persist((prev) => ({
        ...prev,
        pathFilters: { ...prev.pathFilters, [pathKey(medium, playMode)]: filters },
      }));
      const snap = getSessionSnapshot();
      if (snap.medium === medium && snap.playMode === playMode) {
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
    persist((prev) => skipTourneyPair(prev));
    void refreshPool({ silent: true });
  }, [persist, refreshPool]);

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
    finalRoundActive: Boolean(session.finalRound),
    tourneyUndoCount: session.tourneyUndo?.length ?? 0,
    contenderCount: session.medium
      ? tourneyContenderIds(session, session.medium).length
      : Math.max(tourneyContenderIds(session, "movie").length, tourneyContenderIds(session, "game").length),
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
