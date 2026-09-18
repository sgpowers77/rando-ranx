"use client";

import { TitlePoster } from "@/components/title-poster";
import { TourneyUndoButton } from "@/components/tourney-stage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CatalogTitle, Medium, PlayMode } from "@/lib/types";

type EmptyCatalogProps = {
  medium: Medium;
  playMode: PlayMode;
  leftoverTitle: CatalogTitle | null;
  isFinalRound?: boolean;
  filterEmpty?: boolean;
  poolError?: string | null;
  poolSource?: string;
  onHome: () => void;
  onChangeMode: () => void;
  onReshuffle: () => void;
  onUndo?: () => void;
  undoCount?: number;
};

export function EmptyCatalog({
  medium,
  playMode,
  leftoverTitle,
  isFinalRound,
  filterEmpty,
  poolError,
  poolSource,
  onHome,
  onChangeMode,
  onReshuffle,
  onUndo,
  undoCount = 0,
}: EmptyCatalogProps) {
  const noun = medium === "movie" ? "movies" : "games";

  if (poolError) {
    return (
      <Card className="border-none bg-card/80 ring-1 ring-white/10">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Could not load the live catalog</CardTitle>
          <CardDescription>
            {poolError} Ranx still works from a small local fallback if the Kaggle movies file is
            missing. Drop movies_metadata.csv into data/ or retry the fetch.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button type="button" onClick={onReshuffle} className="h-11">
            Retry live catalog
          </Button>
          <Button type="button" variant="outline" onClick={onChangeMode} className="h-11">
            Ranx or Tourney
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (filterEmpty) {
    return (
      <Card className="border-none bg-card/80 ring-1 ring-white/10">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Nothing matches these filters</CardTitle>
          <CardDescription>
            No {noun} in the current stack sit in the decades, genres, and obscurity levels you
            checked. Open Filters and include at least one decade. Movie years and genres come
            from The Movies Dataset (release_date, genres, vote/popularity).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button type="button" onClick={onChangeMode} className="h-11">
            Ranx or Tourney
          </Button>
          <Button type="button" variant="outline" onClick={onHome} className="h-11">
            Back to Movies or Games
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (playMode === "tourney" && leftoverTitle && isFinalRound) {
    return (
      <div className="space-y-2">
        <TourneyUndoButton onUndo={onUndo} undoCount={undoCount} />
        <Card className="border-none bg-card/80 ring-1 ring-white/10">
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <TitlePoster catalog={leftoverTitle} size="lg" className="mx-auto sm:mx-0" />
            <div className="min-w-0 flex-1 space-y-3">
              <p className="text-xs font-medium tracking-widest text-primary uppercase">
                Champion
              </p>
              <CardTitle className="font-heading text-3xl leading-tight text-balance">
                {leftoverTitle.title}
              </CardTitle>
              <CardDescription className="text-base">
                {leftoverTitle.year} · Final Round champion. Discard still holds every title that
                lost a vote. Watch tags are unchanged.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button type="button" onClick={onChangeMode} className="h-11">
            Ranx or Tourney
          </Button>
          <Button type="button" variant="outline" onClick={onHome} className="h-11">
            Switch catalog
          </Button>
        </CardContent>
      </Card>
      </div>
    );
  }

  if (playMode === "tourney" && leftoverTitle) {
    return (
      <div className="space-y-2">
        <TourneyUndoButton onUndo={onUndo} undoCount={undoCount} />
        <Card className="border-none bg-card/80 ring-1 ring-white/10">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Odd one out</CardTitle>
          <CardDescription>
            Tourney needs two titles. {leftoverTitle.title} is the last {noun.slice(0, -1)} left in this
            stack. Switch to Ranx to deal it, or deal more titles if something was missed.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button type="button" onClick={onChangeMode} className="h-11">
            Ranx or Tourney
          </Button>
          <Button type="button" variant="outline" onClick={onReshuffle} className="h-11">
            Deal more titles
          </Button>
        </CardContent>
      </Card>
      </div>
    );
  }

  return (
    <Card className="border-none bg-card/80 ring-1 ring-white/10">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">You worked through this stack</CardTitle>
        <CardDescription>
          Every {noun.slice(0, -1)} in this deal already has a result or a Discard entry. Fetch
          another sample from the {poolSource === "dataset" ? "movies dataset" : medium === "movie" ? "movies dataset" : "games list"}, switch
          catalogs, or change filters.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        <Button type="button" onClick={onHome} className="h-11">
          Back to Movies or Games
        </Button>
        <Button type="button" variant="outline" onClick={onChangeMode} className="h-11">
          Rank or Tourney
        </Button>
        <Button type="button" variant="outline" onClick={onReshuffle} className="h-11">
          Deal more titles
        </Button>
      </CardContent>
    </Card>
  );
}
