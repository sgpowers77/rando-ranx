import type { CatalogTitle, Medium } from "@/lib/types";

export type PosterCredit = {
  label: string;
  href: string;
};

export type PosterInfo = {
  url: string;
  credit: PosterCredit;
};

export type PosterSubject = {
  id?: string;
  title: string;
  year: number;
  medium: Medium;
  imdbId?: string;
};

const memory = new Map<string, PosterInfo | null>();

const FILM_INSTANCE_IDS = new Set([
  "Q11424",
  "Q24869",
  "Q202866",
  "Q226730",
  "Q506240",
  "Q29168811",
]);

const GAME_INSTANCE_IDS = new Set(["Q7889"]);

function cacheKey(subject: PosterSubject): string {
  return ["cinema-v2", subject.medium, subject.title, subject.year, subject.imdbId ?? ""].join("|");
}

function commonsFileUrl(fileName: string): string {
  const file = fileName.replace(/^File:/i, "").replaceAll(" ", "_");
  return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file).replaceAll("%2F", "/")}`;
}

function wikiTitleFromArticleUrl(url: string): string {
  const path = url.replace(/^https?:\/\/en\.wikipedia\.org\/wiki\//, "");
  return decodeURIComponent(path.replaceAll("_", " "));
}

function articleUrlFromTitle(pageTitle: string): string {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle.replaceAll(" ", "_"))}`;
}

function creditFromUploadUrl(imageUrl: string, articleUrl: string): PosterCredit {
  try {
    const parsed = new URL(imageUrl);
    if (parsed.hostname === "upload.wikimedia.org" && parsed.pathname.includes("/commons/")) {
      const raw = decodeURIComponent(parsed.pathname.split("/").pop() ?? "");
      const file = raw.replace(/^\d+px-/, "");
      if (file) return { label: "Wikimedia Commons", href: commonsFileUrl(file) };
    }
  } catch {
    // Wikipedia article credit
  }
  return { label: "Wikipedia", href: articleUrl };
}

type WikiSummary = {
  title?: string;
  type?: string;
  description?: string;
  extract?: string;
  thumbnail?: { source?: string };
  originalimage?: { source?: string };
  content_urls?: { desktop?: { page?: string } };
};

async function wikipediaSummary(pageTitle: string, signal?: AbortSignal): Promise<WikiSummary | null> {
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;
  const res = await fetch(summaryUrl, { signal });
  if (!res.ok) return null;
  return (await res.json()) as WikiSummary;
}

function posterFromSummary(summary: WikiSummary | null, pageTitle: string): PosterInfo | null {
  if (!summary) return null;
  const url = summary.thumbnail?.source ?? summary.originalimage?.source;
  if (!url) return null;
  const article = summary.content_urls?.desktop?.page ?? articleUrlFromTitle(summary.title ?? pageTitle);
  return { url, credit: creditFromUploadUrl(url, article) };
}

async function sparql(query: string, signal?: AbortSignal): Promise<Record<string, { value?: string }>[]> {
  const endpoint = new URL("https://query.wikidata.org/sparql");
  endpoint.searchParams.set("format", "json");
  endpoint.searchParams.set("query", query);
  const res = await fetch(endpoint.toString(), {
    signal,
    headers: { Accept: "application/sparql-results+json" },
  });
  if (!res.ok) return [];
  const json = (await res.json()) as { results?: { bindings?: Record<string, { value?: string }>[] } };
  return json.results?.bindings ?? [];
}

function filmOrGameFilter(medium: Medium): string {
  if (medium === "movie") return "?item wdt:P31/wdt:P279* wd:Q11424 .";
  return "?item wdt:P31/wdt:P279* wd:Q7889 .";
}

async function wikiPageFromWikidata(
  title: string,
  year: number,
  medium: Medium,
  imdbId?: string,
  signal?: AbortSignal
): Promise<string | null> {
  const typeLine = filmOrGameFilter(medium);
  if (imdbId && /^tt\d+$/.test(imdbId) && medium === "movie") {
    const rows = await sparql(
      `SELECT ?article WHERE { ?item wdt:P345 "${imdbId}" . ${typeLine} ?article schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> . } LIMIT 1`,
      signal
    );
    const url = rows[0]?.article?.value;
    if (url) return wikiTitleFromArticleUrl(url);
  }
  const escaped = title.replaceAll('"', '\\"');
  const rows = await sparql(
    `SELECT ?article WHERE {
      ?item rdfs:label "${escaped}"@en .
      ${typeLine}
      OPTIONAL { ?item wdt:P577 ?date . }
      FILTER(!BOUND(?date) || YEAR(?date) >= ${year - 1} && YEAR(?date) <= ${year + 1})
      ?article schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> .
    } LIMIT 3`,
    signal
  );
  const url = rows[0]?.article?.value;
  return url ? wikiTitleFromArticleUrl(url) : null;
}

async function wikiSearchCandidates(
  title: string,
  year: number,
  medium: Medium,
  signal?: AbortSignal
): Promise<string[]> {
  const hint = medium === "movie" ? "film" : "video game";
  const queries =
    medium === "movie"
      ? [`"${title}" (${year} film)`, `"${title}" ${year} film`, `"${title}" film`]
      : [`"${title}" (${year} video game)`, `"${title}" video game`];
  const found: string[] = [];
  for (const srsearch of queries) {
    const api = new URL("https://en.wikipedia.org/w/api.php");
    api.searchParams.set("action", "query");
    api.searchParams.set("list", "search");
    api.searchParams.set("srsearch", srsearch);
    api.searchParams.set("srlimit", "6");
    api.searchParams.set("format", "json");
    api.searchParams.set("origin", "*");
    const res = await fetch(api.toString(), { signal });
    if (!res.ok) continue;
    const json = (await res.json()) as { query?: { search?: { title: string }[] } };
    for (const hit of json.query?.search ?? []) {
      if (!found.includes(hit.title)) found.push(hit.title);
    }
    if (found.length >= 8) break;
  }
  return found;
}

type PageMeta = {
  title: string;
  qid?: string;
  templates: string[];
  disambiguation: boolean;
};

async function wikiPageMeta(pageTitle: string, signal?: AbortSignal): Promise<PageMeta | null> {
  const api = new URL("https://en.wikipedia.org/w/api.php");
  api.searchParams.set("action", "query");
  api.searchParams.set("titles", pageTitle);
  api.searchParams.set("redirects", "1");
  api.searchParams.set("prop", "pageprops|templates");
  api.searchParams.set("ppprop", "wikibase_item|disambiguation");
  api.searchParams.set("tlnamespace", "10");
  api.searchParams.set("tllimit", "60");
  api.searchParams.set("format", "json");
  api.searchParams.set("origin", "*");
  const res = await fetch(api.toString(), { signal });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    query?: {
      pages?: Record<
        string,
        {
          title?: string;
          missing?: boolean;
          pageprops?: { wikibase_item?: string; disambiguation?: string };
          templates?: { title: string }[];
        }
      >;
    };
  };
  const page = Object.values(json.query?.pages ?? {})[0];
  if (!page || page.missing || !page.title) return null;
  return {
    title: page.title,
    qid: page.pageprops?.wikibase_item,
    templates: (page.templates ?? []).map((item) => item.title.toLowerCase()),
    disambiguation: page.pageprops?.disambiguation != null,
  };
}

async function entityIsCinema(qid: string, medium: Medium, signal?: AbortSignal): Promise<boolean> {
  const res = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json`, { signal });
  if (!res.ok) return false;
  const json = (await res.json()) as {
    entities?: Record<
      string,
      { claims?: { P31?: { mainsnak?: { datavalue?: { value?: { id?: string } } } }[] } }
    >;
  };
  const ids = (json.entities?.[qid]?.claims?.P31 ?? [])
    .map((claim) => claim.mainsnak?.datavalue?.value?.id)
    .filter((id): id is string => Boolean(id));
  if (medium === "movie") {
    return ids.some((id) => FILM_INSTANCE_IDS.has(id));
  }
  return ids.some((id) => GAME_INSTANCE_IDS.has(id));
}

function titleLooksLikeCinema(pageTitle: string, medium: Medium): boolean {
  if (medium === "movie") return /\(\d{4} film\)$|\(film\)$/i.test(pageTitle);
  return /\(\d{4} video game\)$|\(video game\)$/i.test(pageTitle);
}

function templatesLookLikeCinema(templates: string[], medium: Medium): boolean {
  if (medium === "movie") return templates.some((name) => name === "template:infobox film");
  return templates.some((name) => name === "template:infobox video game");
}

export async function isCinemaWikiPage(
  pageTitle: string,
  medium: Medium,
  signal?: AbortSignal
): Promise<string | null> {
  const meta = await wikiPageMeta(pageTitle, signal);
  if (!meta || meta.disambiguation) return null;
  if (templatesLookLikeCinema(meta.templates, medium) || titleLooksLikeCinema(meta.title, medium)) {
    return meta.title;
  }
  if (meta.qid && (await entityIsCinema(meta.qid, medium, signal))) return meta.title;
  const summary = await wikipediaSummary(meta.title, signal);
  if (!summary || summary.type === "disambiguation") return null;
  const blob = `${summary.description ?? ""} ${summary.extract ?? ""}`.toLowerCase();
  if (medium === "movie") {
    const filmish = /\b(film|movie)\b/.test(blob) && /\b(directed|screenplay|starring|cinematograph)\b/.test(blob);
    const notFilm =
      /\b(singer|actor|actress|novel|album|song|video game|franchise|television series|band)\b/.test(blob) &&
      !/\b\d{4} (american |british |french |italian )?(animated )?film\b/.test(blob);
    if (filmish && !notFilm) return meta.title;
    return null;
  }
  if (/\bvideo game\b/.test(blob) && !/\b(film|novel|album)\b/.test(`${summary.description ?? ""}`.toLowerCase())) {
    return meta.title;
  }
  return null;
}

export async function resolveCinemaWikiPage(
  title: string,
  year: number,
  medium: Medium,
  imdbId?: string,
  signal?: AbortSignal
): Promise<string | null> {
  const fromData = await wikiPageFromWikidata(title, year, medium, imdbId, signal);
  if (fromData) {
    const verified = await isCinemaWikiPage(fromData, medium, signal);
    if (verified) return verified;
  }
  const candidates = await wikiSearchCandidates(title, year, medium, signal);
  for (const candidate of candidates) {
    const verified = await isCinemaWikiPage(candidate, medium, signal);
    if (verified) return verified;
  }
  return null;
}

async function posterFromCommonsFile(value: string, articleUrl: string): Promise<PosterInfo | null> {
  if (!value) return null;
  const fileName = decodeURIComponent(value.split("/").pop() ?? "");
  const url = value.includes("Special:FilePath")
    ? `${value.replace("http://", "https://")}?width=400`
    : value.replace("http://", "https://");
  return {
    url,
    credit: {
      label: "Wikimedia Commons",
      href: fileName ? commonsFileUrl(fileName) : articleUrl,
    },
  };
}

export async function fetchPoster(
  subject: PosterSubject,
  signal?: AbortSignal
): Promise<PosterInfo | null> {
  const key = cacheKey(subject);
  if (memory.has(key)) return memory.get(key) ?? null;

  try {
    const pageTitle = await resolveCinemaWikiPage(
      subject.title,
      subject.year,
      subject.medium,
      subject.imdbId,
      signal
    );
    if (!pageTitle) {
      memory.set(key, null);
      return null;
    }
    const summary = await wikipediaSummary(pageTitle, signal);
    const fromPage = posterFromSummary(summary, pageTitle);
    if (fromPage) {
      memory.set(key, fromPage);
      return fromPage;
    }
    if (subject.imdbId && /^tt\d+$/.test(subject.imdbId) && subject.medium === "movie") {
      const rows = await sparql(
        `SELECT ?image WHERE { ?item wdt:P345 "${subject.imdbId}" . ?item wdt:P31/wdt:P279* wd:Q11424 . ?item wdt:P18 ?image . } LIMIT 1`,
        signal
      );
      const image = rows[0]?.image?.value;
      if (image) {
        const poster = await posterFromCommonsFile(image, articleUrlFromTitle(pageTitle));
        if (poster) {
          memory.set(key, poster);
          return poster;
        }
      }
    }
    memory.set(key, null);
    return null;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    memory.set(key, null);
    return null;
  }
}

export function catalogPosterSubject(title: CatalogTitle): PosterSubject {
  return {
    id: title.id,
    title: title.title,
    year: title.year,
    medium: title.medium,
    imdbId: title.imdbId,
  };
}

function warmupImage(url: string): Promise<void> {
  if (typeof Image === "undefined") return Promise.resolve();
  return new Promise((resolve) => {
    const img = new Image();
    const done = () => resolve();
    img.onload = done;
    img.onerror = done;
    const timer = window.setTimeout(done, 8000);
    img.onload = () => {
      window.clearTimeout(timer);
      resolve();
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      resolve();
    };
    img.src = url;
  });
}

/** Resolve and decode posters for the current dealt stack so the next card is not a first-paint wait. */
export async function preloadPosterStack(titles: CatalogTitle[]): Promise<void> {
  const subjects = titles.map(catalogPosterSubject);
  let cursor = 0;
  const workers = Math.min(4, Math.max(1, subjects.length));
  await Promise.all(
    Array.from({ length: workers }, async () => {
      while (cursor < subjects.length) {
        const subject = subjects[cursor];
        cursor += 1;
        if (!subject) continue;
        try {
          const info = await fetchPoster(subject);
          if (info?.url) await warmupImage(info.url);
        } catch {
          // Preload is best-effort; card UI still has its own timeout / IMDb fallback.
        }
      }
    })
  );
}
