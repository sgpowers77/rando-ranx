import type { CatalogTitle } from "@/lib/types";

export function titleIdentity(title: {
  id: string;
  title: string;
  year: number;
  medium: string;
}): string {
  const name = title.title.trim().toLowerCase().replace(/\s+/g, " ");
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
