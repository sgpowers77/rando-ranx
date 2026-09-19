import type { CatalogTitle } from "@/lib/types";

export function imdbUrlFor(title: Pick<CatalogTitle, "title" | "year" | "imdbId">): string {
  const imdbId = title.imdbId?.trim() ?? "";
  if (/^tt\d+$/.test(imdbId)) return `https://www.imdb.com/title/${imdbId}/`;
  const q = `${title.title} ${title.year}`.trim();
  return `https://www.imdb.com/find/?q=${encodeURIComponent(q)}`;
}

export function titlePageLink(title: Pick<CatalogTitle, "title" | "year" | "imdbId" | "medium" | "musicbrainzId">): {
  href: string;
  label: string;
} {
  if (title.medium === "music") {
    const mbid = title.musicbrainzId?.trim() ?? "";
    if (mbid) {
      return { href: `https://musicbrainz.org/release-group/${mbid}`, label: "MusicBrainz" };
    }
    const q = `${title.title} ${title.year}`.trim();
    return {
      href: `https://musicbrainz.org/search?query=${encodeURIComponent(q)}&type=release_group&method=indexed`,
      label: "MusicBrainz",
    };
  }
  return { href: imdbUrlFor(title), label: "IMDb" };
}
