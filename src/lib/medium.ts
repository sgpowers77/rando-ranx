import type { Medium } from "@/lib/types";

export const MEDIA = ["movie", "game", "music"] as const;

export function isMedium(value: unknown): value is Medium {
  return value === "movie" || value === "game" || value === "music";
}

export function catalogLabel(medium: Medium | null | undefined): string {
  if (medium === "game") return "Games";
  if (medium === "music") return "Music";
  return "Movies";
}

export function catalogNoun(medium: Medium | null | undefined): string {
  if (medium === "game") return "games";
  if (medium === "music") return "albums";
  return "movies";
}

export function unitLabel(medium: Medium | null | undefined): string {
  if (medium === "game") return "Game";
  if (medium === "music") return "Album";
  return "Movie";
}

export function unitNoun(medium: Medium | null | undefined): string {
  if (medium === "game") return "game";
  if (medium === "music") return "album";
  return "movie";
}

export function wikiHint(medium: Medium): string {
  if (medium === "game") return "video game";
  if (medium === "music") return "album";
  return "film";
}

export function heardItLabel(medium: Medium): string {
  if (medium === "game") return "Played It";
  if (medium === "music") return "Heard It";
  return "Seen It";
}

export function skippedItLabel(medium: Medium): string {
  if (medium === "game") return "Haven't Played It";
  if (medium === "music") return "Haven't Heard It";
  return "Haven't Seen It";
}

export function wantItLabel(medium: Medium): string {
  if (medium === "game") return "Want to Play It";
  if (medium === "music") return "Want to Hear It";
  return "Want to See It";
}

export function resultHeardLabel(medium: Medium): string {
  if (medium === "game") return "Played it";
  if (medium === "music") return "Heard it";
  return "Seen it";
}

export function resultSkippedLabel(medium: Medium): string {
  if (medium === "game") return "Haven't played it";
  if (medium === "music") return "Haven't heard it";
  return "Haven't seen it";
}

export function resultWantLabel(medium: Medium): string {
  if (medium === "game") return "Want to play it";
  if (medium === "music") return "Want to hear it";
  return "Want to see it";
}

export function emptyIdMap(): Record<Medium, string[]> {
  return { movie: [], game: [], music: [] };
}

export function emptyFlagMap(): Record<Medium, boolean> {
  return { movie: false, game: false, music: false };
}

export function otherCatalogsLabel(medium: Medium): string {
  return MEDIA.filter((item) => item !== medium)
    .map((item) => catalogLabel(item))
    .join(" and ");
}

export function samplingHeadline(medium: Medium | null | undefined): string {
  if (medium === "game") return "Sampling OpenGameDB + GameDex…";
  if (medium === "music") return "Sampling MusicBrainz albums…";
  return "Sampling The Movies Dataset…";
}

export function samplingBody(medium: Medium | null | undefined): string {
  if (medium === "game") {
    return "Dealing games from the baked OpenGameDB and GameDex index using year, genre, platform, and obscurity.";
  }
  if (medium === "music") {
    return "Dealing albums (release groups) from a baked MusicBrainz index using first-release year, tags, and rating votes.";
  }
  return "Dealing films from movies_metadata.csv using release date, genres, and vote/popularity. Wikipedia stays on search and WTF blurbs.";
}

export function poolSourceBadge(medium: Medium | null | undefined, source: string): string {
  if (source !== "dataset") return "";
  if (medium === "game") return " · OpenGameDB + GameDex";
  if (medium === "music") return " · MusicBrainz";
  return " · Movies Dataset";
}
