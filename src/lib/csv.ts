import { resultLabel } from "@/lib/labels";
import { catalogLabel } from "@/lib/medium";
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
      catalogLabel(entry.medium),
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
      catalogLabel(entry.medium),
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
      catalogLabel(tag.medium),
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
