import { resultHeardLabel, resultSkippedLabel, resultWantLabel } from "@/lib/medium";
import type { PlayMode, SessionResponse } from "@/lib/types";

export function playModeLabel(mode: PlayMode | null | undefined): string {
  return mode === "tourney" ? "Tourney" : "Ranx";
}

export function resultLabel(entry: SessionResponse): string {
  if (entry.origin === "final") {
    return entry.kind === "rated" ? "Final Round (scored)" : "Final Round";
  }
  if (entry.origin === "tourney" || entry.kind === "winner") {
    return "Contender";
  }
  if (entry.kind === "rated") {
    return resultHeardLabel(entry.medium);
  }
  if (entry.kind === "queued") {
    return resultWantLabel(entry.medium);
  }
  return resultSkippedLabel(entry.medium);
}
