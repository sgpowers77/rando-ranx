import { wikiHint } from "@/lib/medium";
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
  imageUrl?: string;
  musicbrainzId?: string;
  steamAppId?: string;
};

const memory = new Map<string, PosterInfo | null>();
const inflight = new Map<string, Promise<PosterInfo | null>>();

const FILM_INSTANCE_IDS = new Set([
  "Q11424",
  "Q24869",
  "Q202866",
  "Q226730",
  "Q506240",
  "Q29168811",
]);

const GAME_INSTANCE_IDS = new Set([
  "Q7889",
  "Q7058673",
  "Q1607015",
  "Q21125433",
]);
const ALBUM_INSTANCE_IDS = new Set(["Q482994", "Q208569", "Q222910"]);

function cacheKey(subject: PosterSubject): string {
  return [
    "poster-v3",
    subject.medium,
    subject.title,
    subject.year,
    subject.imdbId ?? "",
    subject.steamAppId ?? "",
    subject.musicbrainzId ?? "",
    subject.imageUrl ?? "",
  ].join("|");
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
  if (medium === "music") return "?item wdt:P31/wdt:P279* wd:Q482994 .";
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
  const hint = wikiHint(medium);
  const queries =
    medium === "movie"
      ? [`"${title}" (${year} film)`, `"${title}" ${year} film`, `"${title}" film`]
      : medium === "music"
        ? [`"${title}" (${year} album)`, `"${title}" album`]
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
  if (medium === "music") {
    return ids.some((id) => ALBUM_INSTANCE_IDS.has(id));
  }
  return ids.some((id) => GAME_INSTANCE_IDS.has(id));
}

function titleLooksLikeCinema(pageTitle: string, medium: Medium): boolean {
  if (medium === "movie") return /\(\d{4} film\)$|\(film\)$/i.test(pageTitle);
  if (medium === "music") return /\(\d{4} album\)$|\(album\)$/i.test(pageTitle);
  return /\(\d{4} video game\)$|\(video game\)$/i.test(pageTitle);
}

function templatesLookLikeCinema(templates: string[], medium: Medium): boolean {
  if (medium === "movie") return templates.some((name) => name === "template:infobox film");
  if (medium === "music") {
    return templates.some((name) => name === "template:infobox album" || name === "template:infobox studio album");
  }
  return templates.some(
    (name) =>
      name === "template:infobox video game" ||
      name === "template:infobox vg" ||
      name === "template:infobox windows game" ||
      name === "template:infobox macintosh game"
  );
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
  if (medium === "game" && templatesLookLikeCinema(meta.templates, "movie")) return null;
  if (medium === "game" && titleLooksLikeCinema(meta.title, "movie")) return null;
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
  if (medium === "music") {
    if (/\balbum\b/.test(blob) && !/\b(film|video game|novel)\b/.test(`${summary.description ?? ""}`.toLowerCase())) {
      return meta.title;
    }
    return null;
  }
  if (/\bvideo game\b/.test(blob) && !/\b(film|movie|novel|album|television series)\b/.test(`${summary.description ?? ""}`.toLowerCase())) {
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

function parseSteamAppId(subject: PosterSubject): string | null {
  const direct = subject.steamAppId?.trim() ?? "";
  if (/^\d+$/.test(direct)) return direct;
  const fromId = subject.id?.match(/(?:steam|ogdb-steam)[-_]?(\d+)/i)?.[1];
  return fromId && /^\d+$/.test(fromId) ? fromId : null;
}

function steamCoverUrls(appId: string): { url: string; credit: PosterCredit }[] {
  const hosts = ["https://cdn.cloudflare.steamstatic.com", "https://cdn.akamai.steamstatic.com"];
  const files = ["library_600x900.jpg", "library_600x900_2x.jpg", "portrait.png"];
  const credit: PosterCredit = {
    label: "Steam",
    href: `https://store.steampowered.com/app/${appId}`,
  };
  const urls: { url: string; credit: PosterCredit }[] = [];
  for (const host of hosts) {
    for (const file of files) {
      urls.push({ url: `${host}/steam/apps/${appId}/${file}`, credit });
    }
  }
  return urls;
}

function probeImage(url: string, timeoutMs = 5000): Promise<boolean> {
  if (typeof Image === "undefined") return Promise.resolve(true);
  return new Promise((resolve) => {
    const img = new Image();
    const timer = window.setTimeout(() => {
      img.src = "";
      resolve(false);
    }, timeoutMs);
    img.onload = () => {
      window.clearTimeout(timer);
      resolve(img.naturalWidth > 2 && img.naturalHeight > 2);
    };
    img.onerror = () => {
      window.clearTimeout(timer);
      resolve(false);
    };
    img.src = url;
  });
}

async function firstWorkingPoster(
  candidates: { url: string; credit: PosterCredit }[],
  signal?: AbortSignal
): Promise<PosterInfo | null> {
  for (const candidate of candidates) {
    if (signal?.aborted) throw new DOMException("Aborted", "AbortError");
    if (await probeImage(candidate.url)) return { url: candidate.url, credit: candidate.credit };
  }
  return null;
}

async function fetchGameWikidataCover(
  title: string,
  year: number,
  signal?: AbortSignal
): Promise<PosterInfo | null> {
  const escaped = title.replaceAll('"', '\\"');
  const rows = await sparql(
    `SELECT ?image ?steam ?article WHERE {
      ?item rdfs:label "${escaped}"@en .
      ?item wdt:P31/wdt:P279* wd:Q7889 .
      OPTIONAL { ?item wdt:P577 ?date . }
      FILTER(!BOUND(?date) || YEAR(?date) >= ${year - 1} && YEAR(?date) <= ${year + 1})
      OPTIONAL { ?item wdt:P18 ?image . }
      OPTIONAL { ?item wdt:P1733 ?steam . }
      OPTIONAL { ?article schema:about ?item ; schema:isPartOf <https://en.wikipedia.org/> . }
    } LIMIT 5`,
    signal
  );
  for (const row of rows) {
    const steam = row.steam?.value?.trim();
    if (steam && /^\d+$/.test(steam)) {
      const fromSteam = await firstWorkingPoster(steamCoverUrls(steam), signal);
      if (fromSteam) return fromSteam;
    }
  }
  for (const row of rows) {
    const image = row.image?.value;
    const article = row.article?.value;
    if (!image) continue;
    const poster = await posterFromCommonsFile(
      image,
      article ? article.replace("http://", "https://") : articleUrlFromTitle(title)
    );
    if (poster && (await probeImage(poster.url))) return poster;
  }
  return null;
}

async function fetchGamePoster(subject: PosterSubject, signal?: AbortSignal): Promise<PosterInfo | null> {
  if (subject.imageUrl) {
    const baked = await firstWorkingPoster(
      [
        {
          url: subject.imageUrl,
          credit: {
            label: subject.imageUrl.includes("wikimedia") ? "Wikimedia Commons" : "Game catalog",
            href: subject.imageUrl,
          },
        },
      ],
      signal
    );
    if (baked) return baked;
  }

  const steamId = parseSteamAppId(subject);
  if (steamId) {
    const fromSteam = await firstWorkingPoster(steamCoverUrls(steamId), signal);
    if (fromSteam) return fromSteam;
  }

  const fromData = await fetchGameWikidataCover(subject.title, subject.year, signal);
  if (fromData) return fromData;

  const pageTitle = await resolveCinemaWikiPage(subject.title, subject.year, "game", undefined, signal);
  if (!pageTitle) return null;
  const summary = await wikipediaSummary(pageTitle, signal);
  const fromPage = posterFromSummary(summary, pageTitle);
  if (fromPage && (await probeImage(fromPage.url))) return fromPage;
  return null;
}

async function fetchMoviePoster(subject: PosterSubject, signal?: AbortSignal): Promise<PosterInfo | null> {
  const pageTitle = await resolveCinemaWikiPage(
    subject.title,
    subject.year,
    subject.medium,
    subject.imdbId,
    signal
  );
  if (!pageTitle) return null;
  const summary = await wikipediaSummary(pageTitle, signal);
  const fromPage = posterFromSummary(summary, pageTitle);
  if (fromPage) return fromPage;
  if (subject.imdbId && /^tt\d+$/.test(subject.imdbId) && subject.medium === "movie") {
    const rows = await sparql(
      `SELECT ?image WHERE { ?item wdt:P345 "${subject.imdbId}" . ?item wdt:P31/wdt:P279* wd:Q11424 . ?item wdt:P18 ?image . } LIMIT 1`,
      signal
    );
    const image = rows[0]?.image?.value;
    if (image) {
      const poster = await posterFromCommonsFile(image, articleUrlFromTitle(pageTitle));
      if (poster) return poster;
    }
  }
  return null;
}

async function fetchMusicPoster(subject: PosterSubject): Promise<PosterInfo | null> {
  const mbid = subject.musicbrainzId ?? subject.id?.replace(/^mbid-/, "");
  const coverUrl = subject.imageUrl ?? (mbid ? `https://coverartarchive.org/release-group/${mbid}/front-250` : "");
  if (!coverUrl) return null;
  return {
    url: coverUrl,
    credit: {
      label: "Cover Art Archive",
      href: mbid ? `https://musicbrainz.org/release-group/${mbid}` : coverUrl,
    },
  };
}

async function resolvePoster(subject: PosterSubject, signal?: AbortSignal): Promise<PosterInfo | null> {
  if (subject.medium === "music") return fetchMusicPoster(subject);
  if (subject.medium === "game") return fetchGamePoster(subject, signal);
  return fetchMoviePoster(subject, signal);
}

export function peekPoster(subject: PosterSubject): PosterInfo | null | undefined {
  const key = cacheKey(subject);
  if (!memory.has(key)) return undefined;
  return memory.get(key) ?? null;
}

export function hasReadyPoster(title: CatalogTitle): boolean {
  return peekPoster(catalogPosterSubject(title)) != null;
}

export async function fetchPoster(
  subject: PosterSubject,
  signal?: AbortSignal
): Promise<PosterInfo | null> {
  const key = cacheKey(subject);
  if (memory.has(key)) return memory.get(key) ?? null;
  const existing = inflight.get(key);
  const work =
    existing ??
    (async () => {
      try {
        const info = await resolvePoster(subject);
        if (info) memory.set(key, info);
        return info;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") throw error;
        return null;
      } finally {
        inflight.delete(key);
      }
    })();
  if (!existing) inflight.set(key, work);

  if (!signal) return work;
  return new Promise((resolve, reject) => {
    const onAbort = () => reject(new DOMException("Aborted", "AbortError"));
    if (signal.aborted) {
      onAbort();
      return;
    }
    signal.addEventListener("abort", onAbort, { once: true });
    work.then(
      (info) => {
        signal.removeEventListener("abort", onAbort);
        if (!signal.aborted) resolve(info);
      },
      (error: unknown) => {
        signal.removeEventListener("abort", onAbort);
        if (signal.aborted) return;
        reject(error);
      }
    );
  });
}

export function catalogPosterSubject(title: CatalogTitle): PosterSubject {
  return {
    id: title.id,
    title: title.title,
    year: title.year,
    medium: title.medium,
    imdbId: title.imdbId,
    imageUrl: title.imageUrl,
    musicbrainzId: title.musicbrainzId,
    steamAppId: title.steamAppId,
  };
}

function warmupImage(url: string): Promise<void> {
  return probeImage(url, 8000).then(() => undefined);
}

const PRELOAD_WINDOW = 10;

/** Resolve and decode a small window of posters. Never blocks the current pair. */
export async function preloadPosterStack(
  titles: CatalogTitle[],
  options?: { concurrency?: number }
): Promise<void> {
  const subjects = titles.map(catalogPosterSubject).filter((subject) => peekPoster(subject) === undefined);
  let cursor = 0;
  const workers = Math.min(options?.concurrency ?? 2, Math.max(1, subjects.length));
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

export function titlesNeedingPosters(titles: CatalogTitle[]): CatalogTitle[] {
  return titles.filter((title) => !hasReadyPoster(title));
}

/** Keep the next 10 unloaded titles warming. Extra batches come from further down the stack. */
export function scheduleStackPosters(queue: CatalogTitle[], extraWindow = false): void {
  const need = titlesNeedingPosters(queue);
  const lead = need.slice(0, PRELOAD_WINDOW);
  void preloadPosterStack(lead, { concurrency: 2 });
  if (extraWindow) {
    void preloadPosterStack(need.slice(PRELOAD_WINDOW, PRELOAD_WINDOW * 2), { concurrency: 2 });
  }
}

export const POSTER_PRELOAD_EVERY = PRELOAD_WINDOW;
