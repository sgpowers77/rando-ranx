"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Medium, PlayMode } from "@/lib/types";

type EmptyCatalogProps = {
  medium: Medium;
  playMode: PlayMode;
  leftoverTitle: string | null;
  filterEmpty?: boolean;
  onHome: () => void;
  onChangeMode: () => void;
  onReshuffle: () => void;
};

export function EmptyCatalog({
  medium,
  playMode,
  leftoverTitle,
  filterEmpty,
  onHome,
  onChangeMode,
  onReshuffle,
}: EmptyCatalogProps) {
  const noun = medium === "movie" ? "movies" : "games";

  if (filterEmpty) {
    return (
      <Card className="border-none bg-card/80 ring-1 ring-white/10">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Nothing matches these filters</CardTitle>
          <CardDescription>
            No {noun} in the current stack sit in the decades, genres, and obscurity levels you
            checked. Open Path settings and include at least one decade — unchecked decades stay
            out of Rank and Tourney.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button type="button" onClick={onChangeMode} className="h-11">
            Rank or Tourney
          </Button>
          <Button type="button" variant="outline" onClick={onHome} className="h-11">
            Back to Movies or Games
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (playMode === "tourney" && leftoverTitle) {
    return (
      <Card className="border-none bg-card/80 ring-1 ring-white/10">
        <CardHeader>
          <CardTitle className="font-heading text-2xl">Odd one out</CardTitle>
          <CardDescription>
            Tourney needs two titles. {leftoverTitle} is the last {noun.slice(0, -1)} left in this
            stack. Switch to Rank to deal it, or reshuffle leftovers if something was missed.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 sm:flex-row">
          <Button type="button" onClick={onChangeMode} className="h-11">
            Rank or Tourney
          </Button>
          <Button type="button" variant="outline" onClick={onReshuffle} className="h-11">
            Deal leftover titles
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none bg-card/80 ring-1 ring-white/10">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">You worked through this stack</CardTitle>
        <CardDescription>
          Every {noun.slice(0, -1)} in the current {noun} catalog already has a result or a Discard
          entry. Switch catalogs, change mode, or reshuffle only unused titles if that should not be
          true.
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
          Deal leftover titles
        </Button>
      </CardContent>
    </Card>
  );
}
