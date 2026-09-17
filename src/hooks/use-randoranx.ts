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
import type { CatalogTitle, Medium, SessionResponse, StoredSession } from "@/lib/types";
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
  const errorMessage = useSyncExternalStore(
    subscribeSession,
    getHydrateError,
    () => null
  );

  const currentTitle = useMemo<CatalogTitle | null>(() => {
    if (!session.medium) return null;
    const nextId = session.remainingIds[session.medium][0];
    return nextId ? (CATALOG_BY_ID.get(nextId) ?? null) : null;
  }, [session]);

  const persist = useCallback((updater: (prev: StoredSession) => StoredSession) => {
    writeSession(updater(getSessionSnapshot()));
  }, []);

  const chooseMedium = useCallback(
    (medium: Medium) => {
      persist((prev) => {
        const used = usedTitleIds(prev, medium);
        const remaining = prev.remainingIds[medium];
        const queue =
          remaining.length > 0 ? remaining.filter((id) => !used.has(id)) : dealtQueue(medium, used);
        return {
          ...prev,
          medium,
          remainingIds: { ...prev.remainingIds, [medium]: queue },
        };
      });
    },
    [persist]
  );

  const goHome = useCallback(() => {
    persist((prev) => ({ ...prev, medium: null }));
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

  const reshuffleMedium = useCallback(() => {
    persist((prev) => {
      if (!prev.medium) return prev;
      return {
        ...prev,
        remainingIds: {
          ...prev.remainingIds,
          [prev.medium]: dealtQueue(prev.medium, usedTitleIds(prev, prev.medium)),
        },
      };
    });
  }, [persist]);

  const clearSession = useCallback(() => {
    clearStoredSession();
  }, []);

  return {
    session,
    status: mounted ? ("ready" as const) : ("loading" as const),
    errorMessage,
    currentTitle,
    chooseMedium,
    goHome,
    recordAndAdvance,
    reshuffleMedium,
    clearSession,
    dismissError: dismissHydrateError,
  };
}
