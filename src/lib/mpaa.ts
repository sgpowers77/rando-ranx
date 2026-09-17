import type { CatalogTitle, Medium, PathFilters } from "@/lib/types";

export const MPAA_RATINGS = ["G", "PG", "PG-13", "R", "NC-17", "Not Rated"] as const;

export type MpaaRating = (typeof MPAA_RATINGS)[number];

const LEGACY: Record<string, MpaaRating> = {
  G: "G",
  PG: "PG",
  "PG-13": "PG-13",
  R: "R",
  "NC-17": "NC-17",
  X: "NC-17",
  GP: "PG",
  M: "PG",
  "M/PG": "PG",
  NR: "Not Rated",
  UR: "Not Rated",
  UNRATED: "Not Rated",
  "NOT RATED": "Not Rated",
};

export function normalizeMpaa(value: unknown): MpaaRating {
  if (typeof value !== "string") return "Not Rated";
  const key = value.trim().toUpperCase().replace(/\s+/g, " ");
  if (key === "PG-13" || key === "NC-17") return key;
  return LEGACY[key] ?? LEGACY[value.trim()] ?? "Not Rated";
}

export function titleMpaa(title: CatalogTitle): MpaaRating {
  if (title.medium !== "movie") return "Not Rated";
  return normalizeMpaa(title.mpaa);
}

export function parseMpaaList(value: unknown, medium: Medium): MpaaRating[] {
  if (medium !== "movie") return [];
  if (!Array.isArray(value)) return [...MPAA_RATINGS];
  const next = value.map(normalizeMpaa).filter((item, index, all) => all.indexOf(item) === index);
  return next;
}
