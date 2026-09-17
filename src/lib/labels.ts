import type { SessionResponse } from "@/lib/types";

export function resultLabel(entry: SessionResponse): string {
  if (entry.kind === "rated") {
    return entry.medium === "movie" ? "Seen it" : "Played it";
  }
  if (entry.kind === "queued") {
    return entry.medium === "movie" ? "Want to see it" : "Want to play it";
  }
  if (entry.kind === "winner") {
    return "Tourney winner";
  }
  return entry.medium === "movie" ? "Haven't seen it" : "Haven't played it";
}
