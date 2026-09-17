"use client";

import { RatingForm } from "@/components/rating-form";
import { WtfModal } from "@/components/wtf-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import type { CatalogTitle } from "@/lib/types";
import { useRef, useState } from "react";

type TourneyStageProps = {
  pair: [CatalogTitle, CatalogTitle];
  pendingWinner: CatalogTitle | null;
  skipScoring: boolean;
  onPick: (winnerId: string, loserId: string) => void;
  onCancelPick: () => void;
  onComplete: (extras?: { rating?: number; comments?: string }) => void;
  onSkipScoringChange: (skip: boolean) => void;
  onWatchlist: (title: CatalogTitle) => void;
};

const DRAG_TYPE = "application/x-randoranx-title";

export function TourneyStage({
  pair,
  pendingWinner,
  skipScoring,
  onPick,
  onCancelPick,
  onComplete,
  onSkipScoringChange,
  onWatchlist,
}: TourneyStageProps) {
  const [left, right] = pair;
  const medium = left.medium;
  const noun = medium === "movie" ? "movie" : "game";
  const [rememberSkip, setRememberSkip] = useState(skipScoring);
  const [dragging, setDragging] = useState(false);
  const [dropArmed, setDropArmed] = useState(false);
  const [wtfTitle, setWtfTitle] = useState<CatalogTitle | null>(null);
  const dragged = useRef(false);

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
            {pendingWinner.year} · Score this {noun}, or skip scoring and log it as the pick.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RatingForm
            medium={medium}
            onSubmit={(rating, comments) => onComplete({ rating, comments })}
            onCancel={onCancelPick}
            cancelLabel="Pick again"
            submitLabel="Next pair"
          />
          <div className="mt-6 space-y-3 border-t border-border/70 pt-4">
            <Button
              type="button"
              variant="secondary"
              className="h-11 w-full text-base"
              onClick={() => {
                if (rememberSkip) onSkipScoringChange(true);
                onComplete();
              }}
            >
              Skip scoring
            </Button>
            <div className="flex items-start gap-2">
              <Checkbox
                id="remember-skip-scoring"
                checked={rememberSkip}
                onCheckedChange={(value) => {
                  const next = value === true;
                  setRememberSkip(next);
                  if (!next) onSkipScoringChange(false);
                }}
              />
              <Label htmlFor="remember-skip-scoring" className="text-sm leading-snug font-normal">
                Remember this setting — skip the score for future Tourney winners. You can turn this
                off on the next matchup.
              </Label>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const endDrag = () => {
    setDragging(false);
    setDropArmed(false);
  };

  return (
    <div className="space-y-3">
      {skipScoring ? (
        <div className="rounded-xl border border-border/70 bg-card/60 px-4 py-3 text-sm">
          <p className="font-medium">Winner scoring is skipped</p>
          <p className="mt-1 text-muted-foreground">
            Picking a title logs it as the winner with no 1–10 score, then deals the next pair.
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => onSkipScoringChange(false)}
          >
            Score winners again
          </Button>
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Drag a card onto WTF?? for a Wikipedia blurb. That does not count as a pick.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <MatchupCard
          title={left}
          draggedRef={dragged}
          onSelect={() => onPick(left.id, right.id)}
          onDragBegin={() => setDragging(true)}
          onDragEnd={endDrag}
        />
        <MatchupCard
          title={right}
          draggedRef={dragged}
          onSelect={() => onPick(right.id, left.id)}
          onDragBegin={() => setDragging(true)}
          onDragEnd={endDrag}
        />
      </div>

      {dragging ? (
        <div
          role="button"
          tabIndex={0}
          aria-label="WTF drop zone. Drop a tourney card for a short description."
          onDragOver={(event) => {
            event.preventDefault();
            setDropArmed(true);
          }}
          onDragLeave={() => setDropArmed(false)}
          onDrop={(event) => {
            event.preventDefault();
            const raw = event.dataTransfer.getData(DRAG_TYPE) || event.dataTransfer.getData("text/plain");
            const dropped = pair.find((item) => item.id === raw) ?? null;
            endDrag();
            if (dropped) setWtfTitle(dropped);
          }}
          className={`fixed bottom-6 left-1/2 z-40 w-[min(20rem,calc(100%-2rem))] -translate-x-1/2 rounded-2xl border-2 border-dashed px-6 py-5 text-center shadow-lg ${
            dropArmed
              ? "border-primary bg-primary/20 text-foreground"
              : "border-amber-200/70 bg-background/95 text-amber-100"
          }`}
        >
          <p className="font-heading text-2xl tracking-tight">WTF??</p>
          <p className="mt-1 text-xs text-muted-foreground">Drop a card for a quick description</p>
        </div>
      ) : null}

      <WtfModal
        title={wtfTitle}
        open={wtfTitle !== null}
        onOpenChange={(open) => {
          if (!open) setWtfTitle(null);
        }}
        onWatchlist={onWatchlist}
      />
    </div>
  );
}

function MatchupCard({
  title,
  onSelect,
  onDragBegin,
  onDragEnd,
  draggedRef,
}: {
  title: CatalogTitle;
  onSelect: () => void;
  onDragBegin: () => void;
  onDragEnd: () => void;
  draggedRef: { current: boolean };
}) {
  return (
    <Card
      className="border-none bg-card/80 ring-1 ring-white/10"
      draggable
      onDragStart={(event) => {
        draggedRef.current = true;
        event.dataTransfer.setData(DRAG_TYPE, title.id);
        event.dataTransfer.setData("text/plain", title.id);
        event.dataTransfer.effectAllowed = "copy";
        onDragBegin();
      }}
      onDragEnd={onDragEnd}
    >
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
        <Button
          type="button"
          className="h-12 w-full text-base"
          onClick={() => {
            if (draggedRef.current) {
              draggedRef.current = false;
              return;
            }
            onSelect();
          }}
        >
          This one
        </Button>
      </CardContent>
    </Card>
  );
}
