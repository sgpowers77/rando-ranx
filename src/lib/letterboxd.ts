import { resolveTitle } from "@/data/catalog";
import { csvCell } from "@/lib/csv";
import type { CatalogTitle, SessionResponse, WatchTag } from "@/lib/types";

/** Official Letterboxd import headers: https://letterboxd.com/about/importing-data/ */
export const LETTERBOXD_HEADERS = [
  "imdbID",
  "Title",
  "Year",
  "Directors",
  "Rating",
  "Rating10",
  "WatchedDate",
  "Rewatch",
  "Tags",
  "Review",
] as const;

export type LetterboxdExportInput = {
  responses: SessionResponse[];
  watchTags: WatchTag[];
  userQueue: CatalogTitle[];
  customTitles?: CatalogTitle[];
  liveTitles?: CatalogTitle[];
};

function imdbIdOf(title: CatalogTitle | undefined): string {
  const id = title?.imdbId?.trim() ?? "";
  return /^tt\d+$/.test(id) ? id : "";
}

/** RandoRanx 1–10 integer → Letterboxd Rating10 (1–10). */
export function toLetterboxdRating10(rating: number): number {
  return Math.min(10, Math.max(1, Math.round(rating)));
}

/** RandoRanx 1–10 integer → Letterboxd Rating (0.5–5 in half-star steps). */
export function toLetterboxdRating5(rating: number): number {
  return Math.min(5, Math.max(0.5, toLetterboxdRating10(rating) / 2));
}

function emptyRow(): Record<(typeof LETTERBOXD_HEADERS)[number], string> {
  return {
    imdbID: "",
    Title: "",
    Year: "",
    Directors: "",
    Rating: "",
    Rating10: "",
    WatchedDate: "",
    Rewatch: "",
    Tags: "",
    Review: "",
  };
}

function rowValues(row: Record<(typeof LETTERBOXD_HEADERS)[number], string>): string[] {
  return LETTERBOXD_HEADERS.map((key) => row[key]);
}

export function letterboxdRows(input: LetterboxdExportInput): Record<(typeof LETTERBOXD_HEADERS)[number], string>[] {
  const custom = input.customTitles ?? [];
  const live = input.liveTitles ?? [];
  const lookup = (titleId: string) => resolveTitle(titleId, custom, undefined, live);
  const rows = new Map<string, Record<(typeof LETTERBOXD_HEADERS)[number], string>>();

  const upsert = (key: string, patch: Partial<Record<(typeof LETTERBOXD_HEADERS)[number], string>>) => {
    const prev = rows.get(key) ?? emptyRow();
    rows.set(key, { ...prev, ...patch });
  };

  for (const entry of input.responses) {
    if (entry.medium !== "movie") continue;
    const catalog = lookup(entry.titleId);
    const base = {
      imdbID: imdbIdOf(catalog),
      Title: entry.title,
      Year: String(entry.year),
    };
    const isWatched = entry.kind === "rated" || entry.kind === "winner";
    const isWatchlist = entry.kind === "queued";
    if (!isWatched && !isWatchlist) continue;

    const patch: Partial<Record<(typeof LETTERBOXD_HEADERS)[number], string>> = { ...base };
    if (isWatched && entry.kind === "rated" && entry.rating != null) {
      patch.Rating10 = String(toLetterboxdRating10(entry.rating));
      patch.Rating = String(toLetterboxdRating5(entry.rating));
    }
    if (entry.comments?.trim()) patch.Review = entry.comments.trim();
    upsert(entry.titleId, patch);
  }

  for (const tag of input.watchTags) {
    if (tag.medium !== "movie") continue;
    if (rows.has(tag.titleId)) continue;
    const catalog = lookup(tag.titleId);
    upsert(tag.titleId, {
      imdbID: imdbIdOf(catalog),
      Title: tag.title,
      Year: String(tag.year),
    });
  }

  for (const item of input.userQueue) {
    if (item.medium !== "movie") continue;
    if (rows.has(item.id)) continue;
    upsert(item.id, {
      imdbID: imdbIdOf(item),
      Title: item.title,
      Year: String(item.year),
    });
  }

  return [...rows.values()].filter((row) => row.Title);
}

export function letterboxdCsv(input: LetterboxdExportInput): string {
  const body = letterboxdRows(input);
  const lines = [
    LETTERBOXD_HEADERS.join(","),
    ...body.map((row) => rowValues(row).map(csvCell).join(",")),
  ];
  return `${lines.join("\n")}\n`;
}

export function letterboxdRowCount(input: LetterboxdExportInput): number {
  return letterboxdRows(input).length;
}

export function downloadLetterboxdCsv(input: LetterboxdExportInput) {
  const blob = new Blob([letterboxdCsv(input)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `randoranx-letterboxd-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
