import type { CatalogTitle } from "@/lib/types";

export function imdbUrlFor(title: Pick<CatalogTitle, "title" | "year" | "imdbId">): string {
  const imdbId = title.imdbId?.trim() ?? "";
  if (/^tt\d+$/.test(imdbId)) return `https://www.imdb.com/title/${imdbId}/`;
  const q = `${title.title} ${title.year}`.trim();
  return `https://www.imdb.com/find/?q=${encodeURIComponent(q)}`;
}
