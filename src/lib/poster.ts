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
  imageCreditLabel?: string;
  imageCreditHref?: string;
};

const memory = new Map<string, PosterInfo | null>();

function cacheKey(subject: PosterSubject): string {
  return [subject.medium, subject.title, subject.year, subject.imdbId ?? "", subject.id ?? ""].join("|");
}

function commonsFileUrl(fileName: string): string {
  const file = fileName.replace(/^File:/i, "").replaceAll(" ", "_");
  return `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(file).replaceAll("%2F", "/")}`;
}

function creditFromUploadUrl(imageUrl: string, articleUrl: string): PosterCredit {
  try {
    const parsed = new URL(imageUrl);
    if (parsed.hostname === "upload.wikimedia.org" && parsed.pathname.includes("/commons/")) {
      const raw = decodeURIComponent(parsed.pathname.split("/").pop() ?? "");
      const file = raw.replace(/^\d+px-/, "");
      if (file) {
        return { label: "Wikimedia Commons", href: commonsFileUrl(file) };
      }
    }
  } catch {
    // fall through to Wikipedia article
  }
  return { label: "Wikipedia", href: articleUrl };
}

type WikiSummary = {
  title?: string;
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

function posterFromSummary(summary: WikiSummary | null): PosterInfo | null {
  if (!summary) return null;
  const url = summary.thumbnail?.source ?? summary.originalimage?.source;
  if (!url) return null;
  const article =
    summary.content_urls?.desktop?.page ??
    `https://en.wikipedia.org/wiki/${encodeURIComponent((summary.title ?? "").replaceAll(" ", "_"))}`;
  return { url, credit: creditFromUploadUrl(url, article) };
}

async function searchWikiPage(
  title: string,
  year: number,
  medium: Medium,
  extra?: string,
  signal?: AbortSignal
): Promise<string | null> {
  const hint = medium === "movie" ? "film" : "video game";
  const api = new URL("https://en.wikipedia.org/w/api.php");
  api.searchParams.set("action", "query");
  api.searchParams.set("list", "search");
  api.searchParams.set("srsearch", [title, year, extra, hint].filter(Boolean).join(" "));
  api.searchParams.set("srlimit", "1");
  api.searchParams.set("format", "json");
  api.searchParams.set("origin", "*");
  const res = await fetch(api.toString(), { signal });
  if (!res.ok) return null;
  const json = (await res.json()) as { query?: { search?: { title: string }[] } };
  return json.query?.search?.[0]?.title ?? null;
}

async function posterFromImdb(imdbId: string, signal?: AbortSignal): Promise<PosterInfo | null> {
  if (!/^tt\d+$/.test(imdbId)) return null;
  const endpoint = new URL("https://query.wikidata.org/sparql");
  endpoint.searchParams.set("format", "json");
  endpoint.searchParams.set(
    "query",
    `SELECT ?image WHERE { ?item wdt:P345 "${imdbId}" . ?item wdt:P18 ?image . } LIMIT 1`
  );
  const res = await fetch(endpoint.toString(), {
    signal,
    headers: { Accept: "application/sparql-results+json" },
  });
  if (!res.ok) return null;
  const json = (await res.json()) as {
    results?: { bindings?: { image?: { value?: string } }[] };
  };
  const value = json.results?.bindings?.[0]?.image?.value;
  if (!value) return null;
  const fileName = decodeURIComponent(value.split("/").pop() ?? "");
  const url = value.includes("Special:FilePath")
    ? `${value.replace("http://", "https://")}?width=400`
    : value.replace("http://", "https://");
  return {
    url,
    credit: {
      label: "Wikimedia Commons",
      href: fileName ? commonsFileUrl(fileName) : `https://www.imdb.com/title/${imdbId}/`,
    },
  };
}

export async function fetchPoster(
  subject: PosterSubject,
  signal?: AbortSignal
): Promise<PosterInfo | null> {
  if (subject.imageUrl) {
    return {
      url: subject.imageUrl,
      credit: {
        label: subject.imageCreditLabel ?? "Wikipedia",
        href: subject.imageCreditHref ?? subject.imageUrl,
      },
    };
  }

  const key = cacheKey(subject);
  if (memory.has(key)) return memory.get(key) ?? null;

  try {
    const pageTitle = await searchWikiPage(
      subject.title,
      subject.year,
      subject.medium,
      subject.imdbId,
      signal
    );
    const wikiPoster = posterFromSummary(
      pageTitle ? await wikipediaSummary(pageTitle, signal) : await wikipediaSummary(subject.title, signal)
    );
    if (wikiPoster) {
      memory.set(key, wikiPoster);
      return wikiPoster;
    }
    if (subject.imdbId) {
      const imdbPoster = await posterFromImdb(subject.imdbId, signal);
      if (imdbPoster) {
        memory.set(key, imdbPoster);
        return imdbPoster;
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
    imageUrl: title.imageUrl,
    imageCreditLabel: title.imageCreditLabel,
    imageCreditHref: title.imageCreditHref,
  };
}
