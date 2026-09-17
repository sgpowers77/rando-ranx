import type { Medium } from "@/lib/types";

export const WIKI_UA = "RandoRanx/1.0 (https://github.com/sgpowers77/rando-ranx; film years)";

export function extractYearFromWikiText(text: string, timestamp?: string): number | null {
  const titled = text.match(/\((\d{4})\s+(?:[a-z]+\s+)*(?:film|movie|video game)/i);
  if (titled) return clampYear(Number(titled[1]));
  const isA = text.match(/\bis an?\s+(\d{4})\b/i);
  if (isA) return clampYear(Number(isA[1]));
  const years = [...text.matchAll(/\b((?:19|20)\d{2})\b/g)].map((match) => Number(match[1]));
  for (const year of years) {
    const clamped = clampYear(year);
    if (clamped) return clamped;
  }
  if (timestamp) return clampYear(Number(timestamp.slice(0, 4)));
  return null;
}

function clampYear(year: number): number | null {
  const max = new Date().getFullYear() + 2;
  if (year >= 1900 && year <= max) return year;
  return null;
}

const yearCache = new Map<string, number>();

export async function lookupReleaseYear(title: string, medium: Medium): Promise<number | null> {
  const cacheKey = `${medium}:${title}`;
  const cached = yearCache.get(cacheKey);
  if (cached) return cached;
  const direct = await yearFromSummary(title);
  if (direct) {
    yearCache.set(cacheKey, direct);
    return direct;
  }
  const pageTitle = await searchWikipediaPage(title, medium);
  if (!pageTitle) return null;
  const year = await releaseYearForPage(pageTitle);
  if (year) yearCache.set(cacheKey, year);
  return year;
}

export async function releaseYearForPage(pageTitle: string): Promise<number | null> {
  const wikiYear = await yearFromSummary(pageTitle);
  if (wikiYear) return wikiYear;
  return yearFromWikidata(pageTitle);
}

async function searchWikipediaPage(title: string, medium: Medium): Promise<string | null> {
  const hint = medium === "movie" ? "film" : "video game";
  const api = new URL("https://en.wikipedia.org/w/api.php");
  api.searchParams.set("action", "query");
  api.searchParams.set("list", "search");
  api.searchParams.set("srsearch", `"${title}" ${hint}`);
  api.searchParams.set("srlimit", "1");
  api.searchParams.set("format", "json");
  api.searchParams.set("utf8", "1");

  const res = await fetch(api, {
    headers: { "User-Agent": WIKI_UA, Accept: "application/json" },
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as { query?: { search?: { title: string }[] } };
  return json.query?.search?.[0]?.title ?? null;
}

async function yearFromSummary(pageTitle: string): Promise<number | null> {
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;
  const res = await fetch(summaryUrl, {
    headers: { "User-Agent": WIKI_UA, Accept: "application/json" },
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!res.ok) return null;
  const summary = (await res.json()) as {
    title?: string;
    description?: string;
    extract?: string;
    timestamp?: string;
  };
  const blob = `${summary.title ?? pageTitle} ${summary.description ?? ""} ${summary.extract ?? ""}`;
  return extractYearFromWikiText(blob, summary.timestamp);
}

async function yearFromWikidata(pageTitle: string): Promise<number | null> {
  const api = new URL("https://en.wikipedia.org/w/api.php");
  api.searchParams.set("action", "query");
  api.searchParams.set("prop", "pageprops");
  api.searchParams.set("ppprop", "wikibase_item");
  api.searchParams.set("titles", pageTitle);
  api.searchParams.set("format", "json");
  api.searchParams.set("utf8", "1");

  const propsRes = await fetch(api, {
    headers: { "User-Agent": WIKI_UA, Accept: "application/json" },
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!propsRes.ok) return null;
  const propsJson = (await propsRes.json()) as {
    query?: { pages?: Record<string, { pageprops?: { wikibase_item?: string } }> };
  };
  const pages = Object.values(propsJson.query?.pages ?? {});
  const qid = pages[0]?.pageprops?.wikibase_item;
  if (!qid) return null;

  const entityUrl = `https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`;
  const entityRes = await fetch(entityUrl, {
    headers: { "User-Agent": WIKI_UA, Accept: "application/json" },
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!entityRes.ok) return null;
  const entityJson = (await entityRes.json()) as {
    entities?: Record<
      string,
      {
        claims?: {
          P577?: { mainsnak?: { datavalue?: { value?: { time?: string } } } }[];
        };
      }
    >;
  };
  const claims = entityJson.entities?.[qid]?.claims?.P577 ?? [];
  const years = claims
    .map((claim) => claim.mainsnak?.datavalue?.value?.time)
    .map((time) => (time ? clampYear(Number(time.slice(1, 5))) : null))
    .filter((year): year is number => year != null);
  if (years.length === 0) return null;
  return Math.min(...years);
}

export async function lookupReleaseYears(
  titles: { id: string; title: string; medium: Medium }[]
): Promise<Record<string, number>> {
  const years: Record<string, number> = {};
  const batchSize = 6;
  for (let i = 0; i < titles.length; i += batchSize) {
    const batch = titles.slice(i, i + batchSize);
    const resolved = await Promise.all(
      batch.map(async (item) => {
        try {
          const year = await lookupReleaseYear(item.title, item.medium);
          return year != null ? ([item.id, year] as const) : null;
        } catch {
          return null;
        }
      })
    );
    for (const pair of resolved) {
      if (pair) years[pair[0]] = pair[1];
    }
  }
  return years;
}
