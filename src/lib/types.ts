export type Medium = "movie" | "game";

export type PlayMode = "rank" | "tourney";

export type PathKey = `${Medium}:${PlayMode}`;

export type CatalogTitle = {
  id: string;
  medium: Medium;
  title: string;
  year: number;
  genres: string[];
  obscurity: 1 | 2 | 3 | 4 | 5;
  source?: "catalog" | "search";
};

export type PathFilters = {
  decades: number[];
  genres: string[];
  obscurity: number[];
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

export type WatchTag = {
  titleId: string;
  medium: Medium;
  title: string;
  year: number;
  taggedAt: string;
};

export type StoredSession = {
  version: 1;
  medium: Medium | null;
  playMode: PlayMode | null;
  remainingIds: Record<Medium, string[]>;
  responses: SessionResponse[];
  discards: DiscardEntry[];
  watchTags: WatchTag[];
  pendingTourney: PendingTourney | null;
  skipTourneyScoring: boolean;
  customTitles: CatalogTitle[];
  pathFilters: Partial<Record<PathKey, PathFilters>>;
  recentlyShown: Record<Medium, string[]>;
  releaseYears: Record<string, number>;
};
