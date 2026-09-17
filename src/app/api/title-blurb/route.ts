import { NextRequest, NextResponse } from "next/server";

const UA = "RandoRanx/1.0 (https://github.com/sgpowers77/rando-ranx; title blurb)";

export async function GET(request: NextRequest) {
  const title = request.nextUrl.searchParams.get("title")?.trim() ?? "";
  const year = request.nextUrl.searchParams.get("year")?.trim() ?? "";
  const medium = request.nextUrl.searchParams.get("medium") === "game" ? "game" : "movie";
  if (title.length < 1) {
    return NextResponse.json({ extract: "", sourceUrl: "", source: "none" }, { status: 400 });
  }

  const imdb = request.nextUrl.searchParams.get("imdb")?.trim() ?? "";
  const hint = medium === "movie" ? "film" : "video game";
  const query = [title, year, imdb, hint].filter(Boolean).join(" ");

  try {
    const wiki = await fetchWikipediaBlurb(query, title);
    if (wiki) return NextResponse.json(wiki);
  } catch {
    // local fallback below
  }

  const wikiSearch = `https://en.wikipedia.org/wiki/Special:Search?search=${encodeURIComponent(title)}`;
  return NextResponse.json({
    extract: `${title}${year ? ` (${year})` : ""} is in the RandoRanx catalog. Wikipedia did not return a summary just now.`,
    sourceUrl: wikiSearch,
    source: "local",
  });
}

async function fetchWikipediaBlurb(query: string, title: string) {
  const api = new URL("https://en.wikipedia.org/w/api.php");
  api.searchParams.set("action", "query");
  api.searchParams.set("list", "search");
  api.searchParams.set("srsearch", query);
  api.searchParams.set("srlimit", "1");
  api.searchParams.set("format", "json");
  api.searchParams.set("utf8", "1");

  const searchRes = await fetch(api, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!searchRes.ok) return null;
  const searchJson = (await searchRes.json()) as {
    query?: { search?: { title: string }[] };
  };
  const pageTitle = searchJson.query?.search?.[0]?.title ?? title;
  const summaryUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(pageTitle)}`;
  const summaryRes = await fetch(summaryUrl, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!summaryRes.ok) return null;
  const summary = (await summaryRes.json()) as {
    extract?: string;
    content_urls?: { desktop?: { page?: string } };
    title?: string;
  };
  const sourceUrl =
    summary.content_urls?.desktop?.page ??
    `https://en.wikipedia.org/wiki/${encodeURIComponent(pageTitle.replaceAll(" ", "_"))}`;
  const extract = summary.extract?.trim();
  if (!extract) return null;
  return { extract, sourceUrl, source: "wikipedia" as const };
}
