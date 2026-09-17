"use client";

import { RatingForm } from "@/components/rating-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { CatalogTitle } from "@/lib/types";

type TourneyStageProps = {
  pair: [CatalogTitle, CatalogTitle];
  pendingWinner: CatalogTitle | null;
  onPick: (winnerId: string, loserId: string) => void;
  onCancelPick: () => void;
  onComplete: (rating: number, comments: string) => void;
};

export function TourneyStage({
  pair,
  pendingWinner,
  onPick,
  onCancelPick,
  onComplete,
}: TourneyStageProps) {
  const [left, right] = pair;
  const medium = left.medium;
  const noun = medium === "movie" ? "movie" : "game";

  if (pendingWinner) {
    return (
      <Card className="border-none bg-card/80 ring-1 ring-white/10">
        <CardHeader className="gap-3">
          <p className="text-xs font-medium tracking-widest text-amber-200/80 uppercase">
            Tourney winner
          </p>
          <CardTitle className="font-heading text-3xl leading-tight text-balance sm:text-4xl">
            {pendingWinner.title}
          </CardTitle>
          <CardDescription className="text-base text-muted-foreground">
            {pendingWinner.year} · Score this {noun} the same way you would in Rank, then deal the
            next pair.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RatingForm
            medium={medium}
            onSubmit={onComplete}
            onCancel={onCancelPick}
            cancelLabel="Pick again"
            submitLabel="Next pair"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <MatchupCard title={left} onSelect={() => onPick(left.id, right.id)} />
      <MatchupCard title={right} onSelect={() => onPick(right.id, left.id)} />
    </div>
  );
}

function MatchupCard({ title, onSelect }: { title: CatalogTitle; onSelect: () => void }) {
  return (
    <Card className="border-none bg-card/80 ring-1 ring-white/10">
      <CardHeader className="gap-2">
        <p className="text-xs font-medium tracking-widest text-amber-200/80 uppercase">
          {title.medium === "movie" ? "Movie" : "Game"}
        </p>
        <CardTitle className="font-heading text-2xl leading-tight text-balance sm:text-3xl">
          {title.title}
        </CardTitle>
        <CardDescription className="text-base">{title.year}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button type="button" className="h-12 w-full text-base" onClick={onSelect}>
          This one
        </Button>
      </CardContent>
    </Card>
  );
}
