import { defaultFilters, filtersComplete } from "@/lib/filters";
import { sampleTitlePool } from "@/lib/movies-dataset";
import type { Medium, PathFilters } from "@/lib/types";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  try {
    const { loadMovieIndex, movieIndexStatus } = await import("@/lib/movies-dataset");
    await loadMovieIndex();
    return NextResponse.json({ ok: true, ...movieIndexStatus() });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "warmup failed" },
      { status: 503 }
    );
  }
}

export async function POST(request: NextRequest) {
  let body: {
    medium?: Medium;
    filters?: PathFilters;
    excludeIds?: string[];
    limit?: number;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ titles: [], source: "none" }, { status: 400 });
  }

  const medium = body.medium === "game" ? "game" : "movie";
  const filters = body.filters ?? defaultFilters(medium);
  if (!filtersComplete(filters)) {
    return NextResponse.json({ titles: [], source: "none", available: 0 });
  }

  const excludeIds = Array.isArray(body.excludeIds)
    ? body.excludeIds.filter((id): id is string => typeof id === "string").slice(0, 400)
    : [];

  try {
    const result = await sampleTitlePool({
      medium,
      filters,
      excludeIds,
      limit: typeof body.limit === "number" ? body.limit : 36,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        titles: [],
        source: "none",
        available: 0,
        error: error instanceof Error ? error.message : "Pool failed",
      },
      { status: 502 }
    );
  }
}
