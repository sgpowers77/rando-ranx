export type Medium = "movie" | "game";

export type PlayMode = "rank" | "tourney";

export type CatalogTitle = {
  id: string;
  medium: Medium;
  title: string;
  year: number;
};

export type ResponseKind = "rated" | "skipped" | "queued" | "winner";

export type SessionResponse = {
  id: string;
  titleId: string;
  medium: Medium;
  title: string;
  year: number;
  kind: ResponseKind;
  rating?: number;
  comments?: string;
  recordedAt: string;
};

export type DiscardEntry = {
  id: string;
  titleId: string;
  medium: Medium;
  title: string;
  year: number;
  lostToTitle: string;
  recordedAt: string;
};

export type PendingTourney = {
  winnerId: string;
  loserId: string;
};

export type StoredSession = {
  version: 1;
  medium: Medium | null;
  playMode: PlayMode | null;
  remainingIds: Record<Medium, string[]>;
  responses: SessionResponse[];
  discards: DiscardEntry[];
  pendingTourney: PendingTourney | null;
  skipTourneyScoring: boolean;
};
