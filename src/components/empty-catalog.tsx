"use client";

import { TitlePoster } from "@/components/title-poster";
import { TourneyUndoButton } from "@/components/tourney-stage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TitleDirector } from "@/hooks/use-director";
import { playModeLabel } from "@/lib/labels";
import { catalogLabel, catalogNoun } from "@/lib/medium";
import type { CatalogTitle, Medium, PlayMode } from "@/lib/types";

type EmptyCatalogProps = {
  medium: Medium;
  playMode: PlayMode;
  leftoverTitle: CatalogTitle | null;
  isFinalRound?: boolean;
  filterEmpty?: boolean;
  poolError?: string | null;
  poolSource?: string;
  canFinalRound?: boolean;
  contenderCount?: number;
  onHome: () => void;
  onChangeMode: () => void;
  onReshuffle: () => void;
  onFinalRound?: () => void;
  onReturnHome?: () => void;
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
  canFinalRound = false,
  contenderCount = 0,
  onHome,
  onChangeMode,
  onReshuffle,
  onFinalRound,
  onReturnHome,
  onUndo,
  undoCount = 0,
}: EmptyCatalogProps) {
  const noun = catalogNoun(medium);
  const catalog = catalogLabel(medium);
  const modeLabel = playModeLabel(playMode);
  const champion = Boolean(playMode === "tourney" && leftoverTitle && isFinalRound);

  if (poolError) {
    return (
      <Card className="border-none bg-card/80 ring-1 ring-white/10">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Could not load the live catalog</CardTitle>
          <CardDescription>
            {poolError}{" "}
            {medium === "movie"
              ? "Ranx still works from a small local fallback if the Kaggle movies file is missing. Drop movies_metadata.csv into data/ or retry the fetch."
              : medium === "game"
                ? "Ranx still works from a small local games list if the OpenGameDB / GameDex index is missing. Run npm run fetch-games and npm run build-games-index, then retry."
                : "Ranx still works from a small local album list if the MusicBrainz index is missing. Run npm run fetch-music and npm run build-music-index, then retry."}
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
            checked. Open Filters and include at least one decade
            {medium === "game" ? " and platform family" : ""}.{" "}
            {medium === "movie"
              ? "Movie years and genres come from The Movies Dataset (release_date, genres, vote/popularity)."
              : medium === "game"
                ? "Game years, genres, platforms, and obscurity come from OpenGameDB and GameDex."
                : "Album years, genres, and obscurity come from MusicBrainz release groups."}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button type="button" onClick={onChangeMode} className="h-11">
            Ranx or Tourney
          </Button>
          <Button type="button" variant="outline" onClick={onHome} className="h-11">
            Back to catalog pick
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (champion && leftoverTitle) {
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
                <TitleDirector title={leftoverTitle} />
                <CardDescription className="text-base">
                  {leftoverTitle.year} · Final Round champion. Watch, ratings, comments, and notes
                  stay on this {catalog} log. Return Home clears this Tourney log’s Contenders and
                  Discard.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button type="button" onClick={onReturnHome ?? onHome} className="h-12 w-full text-base">
              Return Home
            </Button>
            <Button type="button" variant="outline" onClick={onChangeMode} className="h-11 w-full">
              Ranx or Tourney
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
              Tourney needs two titles. {leftoverTitle.title} is the last {noun.slice(0, -1)} left in
              this stack. Start Final Round with your Contenders, or deal more titles.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <FinalRoundCta
              canFinalRound={canFinalRound}
              contenderCount={contenderCount}
              onFinalRound={onFinalRound}
            />
            <Button type="button" variant="outline" onClick={onReshuffle} className="h-11 w-full">
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
          Every {noun.slice(0, -1)} in this {modeLabel} deal already has a result or a Discard entry.
          Start Final Round with your Contenders, or fetch another sample from the{" "}
          {medium === "movie"
            ? "movies dataset"
            : medium === "game"
              ? poolSource === "dataset"
                ? "OpenGameDB + GameDex catalog"
                : "games list"
              : poolSource === "dataset"
                ? "MusicBrainz album catalog"
                : "album list"}
          .
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <FinalRoundCta
          canFinalRound={canFinalRound}
          contenderCount={contenderCount}
          onFinalRound={onFinalRound}
        />
        <Button type="button" variant="outline" onClick={onReshuffle} className="h-11 w-full">
          Deal more titles
        </Button>
        <Button type="button" variant="ghost" onClick={onChangeMode} className="h-11 w-full">
          Ranx or Tourney
        </Button>
      </CardContent>
    </Card>
  );
}

function FinalRoundCta({
  canFinalRound,
  contenderCount,
  onFinalRound,
}: {
  canFinalRound: boolean;
  contenderCount: number;
  onFinalRound?: () => void;
}) {
  return (
    <div className="space-y-1.5">
      <Button
        type="button"
        className="h-12 w-full text-base"
        disabled={!canFinalRound || !onFinalRound}
        onClick={onFinalRound}
      >
        Final Round
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        {canFinalRound
          ? `Vote among ${contenderCount} logged Contenders until a champion.`
          : "Log at least two Tourney Contenders, then start Final Round."}
      </p>
    </div>
  );
}
