import { resultLabel } from "@/lib/labels";
import type { DiscardEntry, SessionResponse, WatchTag } from "@/lib/types";

export function csvCell(value: string | number | boolean | null | undefined): string {
  const text = value == null ? "" : String(value);
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

export function sessionCsv(
  responses: SessionResponse[],
  discards: DiscardEntry[],
  watchTags: WatchTag[]
): string {
  const watchByTitle = new Map(watchTags.map((tag) => [tag.titleId, tag]));
  const loggedIds = new Set<string>();
  const header = [
    "source",
    "title",
    "year",
    "catalog",
    "action",
    "rating",
    "comments",
    "watchlisted",
    "watch_tagged_at",
    "recorded_at",
    "lost_to",
  ];
  const rows: string[][] = [header];

  for (const entry of responses) {
    loggedIds.add(entry.titleId);
    const watch = watchByTitle.get(entry.titleId);
    rows.push([
      "result",
      entry.title,
      String(entry.year),
      entry.medium === "movie" ? "Movies" : "Games",
      resultLabel(entry),
      entry.kind === "rated" && entry.rating != null ? String(entry.rating) : "",
      entry.comments?.trim() ?? "",
      watch ? "yes" : "no",
      watch?.taggedAt ?? "",
      entry.recordedAt,
      "",
    ]);
  }

  for (const entry of discards) {
    loggedIds.add(entry.titleId);
    const watch = watchByTitle.get(entry.titleId);
    rows.push([
      "discard",
      entry.title,
      String(entry.year),
      entry.medium === "movie" ? "Movies" : "Games",
      `Discarded vs ${entry.lostToTitle}`,
      "",
      "",
      watch ? "yes" : "no",
      watch?.taggedAt ?? "",
      entry.recordedAt,
      entry.lostToTitle,
    ]);
  }

  for (const tag of watchTags) {
    if (loggedIds.has(tag.titleId)) continue;
    rows.push([
      "watch",
      tag.title,
      String(tag.year),
      tag.medium === "movie" ? "Movies" : "Games",
      "Watchlist",
      "",
      "",
      "yes",
      tag.taggedAt,
      tag.taggedAt,
      "",
    ]);
  }

  return rows.map((row) => row.map(csvCell).join(",")).join("\n") + "\n";
}

export function filtersCsv(medium: "movie" | "game", filters: {
  decades: number[];
  genres: string[];
  obscurity: number[];
  mpaa: string[];
  includeForeign: boolean;
  stackSize: number;
}): string {
  const header = [
    "medium",
    "decades",
    "genres",
    "rating",
    "obscurity",
    "stack_size",
    "include_foreign",
  ];
  const row = [
    medium === "movie" ? "Movies" : "Games",
    filters.decades.map((decade) => `${decade}s`).join("; "),
    filters.genres.join("; "),
    medium === "movie" ? (filters.mpaa ?? []).join("; ") : "",
    filters.obscurity.join("; "),
    String(filters.stackSize),
    medium === "movie" ? (filters.includeForeign ? "yes" : "no") : "",
  ];
  return `${header.map(csvCell).join(",")}\n${row.map(csvCell).join(",")}\n`;
}

export function downloadFiltersCsv(
  medium: "movie" | "game",
  filters: {
    decades: number[];
    genres: string[];
    obscurity: number[];
    mpaa: string[];
    includeForeign: boolean;
    stackSize: number;
  }
) {
  const blob = new Blob([filtersCsv(medium, filters)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `randoranx-filters-${medium}-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function downloadSessionCsv(
  responses: SessionResponse[],
  discards: DiscardEntry[],
  watchTags: WatchTag[]
) {
  const blob = new Blob([sessionCsv(responses, discards, watchTags)], {
    type: "text/csv;charset=utf-8",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `randoranx-session-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
