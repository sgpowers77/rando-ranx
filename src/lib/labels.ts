import type { SessionResponse } from "@/lib/types";

export function resultLabel(entry: SessionResponse): string {
  if (entry.origin === "final") {
    return entry.kind === "rated" ? "Final Round (scored)" : "Final Round";
  }
  if (entry.origin === "tourney" || entry.kind === "winner") {
    return "Contender";
  }
  if (entry.kind === "rated") {
    return entry.medium === "movie" ? "Seen it" : "Played it";
  }
  if (entry.kind === "queued") {
    return entry.medium === "movie" ? "Want to see it" : "Want to play it";
  }
  return entry.medium === "movie" ? "Haven't seen it" : "Haven't played it";
}
