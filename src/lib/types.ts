export type Medium = "movie" | "game";

export type CatalogTitle = {
  id: string;
  medium: Medium;
  title: string;
  year: number;
};

export type ResponseKind = "rated" | "skipped" | "queued";

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

export type StoredSession = {
  version: 1;
  medium: Medium | null;
  remainingIds: Record<Medium, string[]>;
  responses: SessionResponse[];
};
