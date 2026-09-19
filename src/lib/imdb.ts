import type { CatalogTitle } from "@/lib/types";

export function imdbUrlFor(title: Pick<CatalogTitle, "title" | "year" | "imdbId">): string {
  const imdbId = title.imdbId?.trim() ?? "";
  if (/^tt\d+$/.test(imdbId)) return `https://www.imdb.com/title/${imdbId}/`;
  const q = `${title.title} ${title.year}`.trim();
  return `https://www.imdb.com/find/?q=${encodeURIComponent(q)}`;
}

/** Wikipedia album / release-group search that prefers an exact article hit. */
export function wikipediaAlbumUrl(title: {
  title: string;
  year: number;
  artist?: string;
}): string {
  const q = [title.title, title.artist, String(title.year), "album"]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(" ");
  return `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(q)}&go=Go`;
}

export function titlePageLink(
  title: Pick<CatalogTitle, "title" | "year" | "imdbId" | "medium" | "musicbrainzId" | "artist">
): {
  href: string;
  label: string;
} {
  if (title.medium === "music") {
    return { href: wikipediaAlbumUrl(title), label: "Wikipedia" };
  }
  return { href: imdbUrlFor(title), label: "IMDb" };
}
