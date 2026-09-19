import type { CatalogTitle } from "@/lib/types";

export function titleIdentity(title: {
  id: string;
  title: string;
  year: number;
  medium: string;
  artist?: string;
}): string {
  const name = title.title.trim().toLowerCase().replace(/\s+/g, " ");
  const artist = (title.artist ?? "").trim().toLowerCase().replace(/\s+/g, " ");
  if (title.medium === "music" && artist) {
    return `${title.medium}|${name}|${title.year}|${artist}`;
  }
  return `${title.medium}|${name}|${title.year}`;
}

export function sameTitleIdentity(
  a: { id: string; title: string; year: number; medium: string },
  b: { id: string; title: string; year: number; medium: string }
): boolean {
  return a.id === b.id || titleIdentity(a) === titleIdentity(b);
}

export function uniqueTitles<T extends { id: string; title: string; year: number; medium: string }>(
  titles: T[]
): T[] {
  const seenIds = new Set<string>();
  const seenKeys = new Set<string>();
  const next: T[] = [];
  for (const title of titles) {
    const key = titleIdentity(title);
    if (seenIds.has(title.id) || seenKeys.has(key)) continue;
    seenIds.add(title.id);
    seenKeys.add(key);
    next.push(title);
  }
  return next;
}

/** Keep the first identity, but copy later cover/Steam fields onto it. */
export function mergeCatalogTitles<T extends CatalogTitle>(titles: T[]): T[] {
  const byId = new Map<string, T>();
  const byKey = new Map<string, T>();
  const order: string[] = [];
  for (const title of titles) {
    const key = titleIdentity(title);
    const existing = byId.get(title.id) ?? byKey.get(key);
    if (!existing) {
      byId.set(title.id, title);
      byKey.set(key, title);
      order.push(title.id);
      continue;
    }
    const merged = {
      ...existing,
      steamAppId: existing.steamAppId || title.steamAppId,
      imageUrl: existing.imageUrl || title.imageUrl,
      imageCreditLabel: existing.imageCreditLabel || title.imageCreditLabel,
      imageCreditHref: existing.imageCreditHref || title.imageCreditHref,
      musicbrainzId: existing.musicbrainzId || title.musicbrainzId,
      imdbId: existing.imdbId || title.imdbId,
      platforms:
        existing.platforms && existing.platforms.length > 0 ? existing.platforms : title.platforms,
    };
    byId.set(existing.id, merged);
    byKey.set(key, merged);
  }
  return order.map((id) => byId.get(id)).filter((item): item is T => item != null);
}

export function pickDistinctTitles(
  candidates: CatalogTitle[],
  blocked: CatalogTitle[],
  count: number
): CatalogTitle[] {
  const blockedIds = new Set(blocked.map((item) => item.id));
  const blockedKeys = new Set(blocked.map((item) => titleIdentity(item)));
  const picked: CatalogTitle[] = [];
  const seenIds = new Set<string>();
  const seenKeys = new Set<string>();
  for (const title of candidates) {
    const key = titleIdentity(title);
    if (
      blockedIds.has(title.id) ||
      blockedKeys.has(key) ||
      seenIds.has(title.id) ||
      seenKeys.has(key)
    ) {
      continue;
    }
    seenIds.add(title.id);
    seenKeys.add(key);
    picked.push(title);
    if (picked.length >= count) break;
  }
  return picked;
}

export function distinctTourneyPair(queue: CatalogTitle[]): [CatalogTitle, CatalogTitle] | null {
  const first = queue[0];
  if (!first) return null;
  const second = queue.find((item, index) => index > 0 && !sameTitleIdentity(first, item));
  return first && second ? [first, second] : null;
}
