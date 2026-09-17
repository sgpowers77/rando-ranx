import { lookupReleaseYears } from "@/lib/wiki-lookup";
import type { Medium } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

type YearRequestTitle = {
  id: string;
  title: string;
  medium: Medium;
};

export async function POST(request: NextRequest) {
  let body: { titles?: YearRequestTitle[] };
  try {
    body = (await request.json()) as { titles?: YearRequestTitle[] };
  } catch {
    return NextResponse.json({ years: {}, source: "none" }, { status: 400 });
  }

  const titles = (body.titles ?? [])
    .filter(
      (item): item is YearRequestTitle =>
        Boolean(item) &&
        typeof item.id === "string" &&
        typeof item.title === "string" &&
        (item.medium === "movie" || item.medium === "game")
    )
    .slice(0, 80);

  if (titles.length === 0) {
    return NextResponse.json({ years: {}, source: "none" });
  }

  try {
    const years = await lookupReleaseYears(titles);
    return NextResponse.json({ years, source: "wikipedia" });
  } catch {
    return NextResponse.json({ years: {}, source: "none" }, { status: 502 });
  }
}
