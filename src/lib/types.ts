export type Medium = "movie" | "game";

export type PlayMode = "rank" | "tourney";

export type CatalogTitle = {
  id: string;
  medium: Medium;
  title: string;
  year: number;
  genres: string[];
  obscurity: 1 | 2 | 3 | 4 | 5;
  mpaa?: string;
  source?: "catalog" | "search" | "dataset";
  imdbId?: string;
  originalLanguage?: string;
  englishDialogue?: boolean;
  imageUrl?: string;
  imageCreditLabel?: string;
  imageCreditHref?: string;
  director?: string;
};

export type StackSize = 10 | 25 | 50 | 100;

export type PathFilters = {
  decades: number[];
  genres: string[];
  obscurity: number[];
  mpaa: string[];
  includeForeign: boolean;
  stackSize: StackSize;
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
  watchedDate?: string;
  origin?: "rank" | "tourney" | "final";
};

export type RatingExtras = {
  rating?: number;
  comments?: string;
  watchedDate?: string;
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

export type FinalRound = {
  medium: Medium;
  remainingIds: string[];
};

export type TourneyUndoFrame = {
  remainingIds: string[];
  finalRound: FinalRound | null;
  responses: SessionResponse[];
  discards: DiscardEntry[];
  recentlyShown: Record<Medium, string[]>;
};

export type StoredSession = {
  version: 1;
  medium: Medium | null;
  playMode: PlayMode | null;
  remainingIds: Record<Medium, string[]>;
  responses: SessionResponse[];
  discards: DiscardEntry[];
  watchTags: WatchTag[];
  userQueue: CatalogTitle[];
  queueOnly: boolean;
  pendingTourney: PendingTourney | null;
  skipTourneyScoring: boolean;
  customTitles: CatalogTitle[];
  pathFilters: Partial<Record<Medium, PathFilters>>;
  recentlyShown: Record<Medium, string[]>;
  releaseYears: Record<string, number>;
  liveTitles: CatalogTitle[];
  finalRounds: Record<Medium, FinalRound | null>;
  tourneyUndos: Record<Medium, TourneyUndoFrame[]>;
};
