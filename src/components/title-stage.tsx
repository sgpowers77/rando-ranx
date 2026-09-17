"use client";

import { BookmarkIconButton, CardIconBar } from "@/components/card-icon-bar";
import { RatingForm } from "@/components/rating-form";
import { TitlePoster } from "@/components/title-poster";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { decadeOf } from "@/lib/filters";
import type { CatalogTitle, Medium } from "@/lib/types";
import { useState } from "react";

type TitleStageProps = {
  title: CatalogTitle;
  watched?: boolean;
  onToggleWatch?: () => void;
  onRated: (rating: number, comments: string) => void;
  onSkip: () => void;
  onQueue: () => void;
};

export function TitleStage({ title, watched = false, onToggleWatch, onRated, onSkip, onQueue }: TitleStageProps) {
  const [mode, setMode] = useState<"choose" | "rate">("choose");
  const medium: Medium = title.medium;
  const seenLabel = medium === "movie" ? "Seen It" : "Played It";
  const skipLabel = medium === "movie" ? "Haven't Seen It" : "Haven't Played It";
  const wantLabel = medium === "movie" ? "Want to See It" : "Want to Play It";

  return (
    <Card className="overflow-visible border-none bg-card/80 ring-1 ring-white/10">
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <TitlePoster catalog={title} size="lg" className="mx-auto sm:mx-0" />
          <div className="relative min-w-0 flex-1 space-y-3">
            {onToggleWatch ? (
              <CardIconBar>
                <BookmarkIconButton
                  active={watched}
                  label={watched ? `Remove ${title.title} from watchlist` : `Add ${title.title} to watchlist`}
                  onClick={onToggleWatch}
                />
              </CardIconBar>
            ) : null}
            <p className="pr-12 text-xs font-medium tracking-widest text-amber-200/80 uppercase">
              {medium === "movie" ? "Movie" : "Game"}
            </p>
            <CardTitle className="font-heading pr-12 text-3xl leading-tight text-balance sm:text-4xl">
              {title.title}
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              {title.year} · {decadeOf(title.year)}s
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {mode === "choose" ? (
          <div className="grid gap-2">
            <Button type="button" className="h-12 text-base" onClick={() => setMode("rate")}>
              {seenLabel}
            </Button>
            <Button type="button" variant="secondary" className="h-12 text-base" onClick={onSkip}>
              {skipLabel}
            </Button>
            <Button type="button" variant="outline" className="h-12 text-base" onClick={onQueue}>
              {wantLabel}
            </Button>
          </div>
        ) : (
          <RatingForm
            medium={medium}
            onSubmit={onRated}
            onCancel={() => setMode("choose")}
          />
        )}
      </CardContent>
    </Card>
  );
}
