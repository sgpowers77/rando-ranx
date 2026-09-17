"use client";

import { BookmarkIconButton, CardIconBar } from "@/components/card-icon-bar";
import { RatingForm } from "@/components/rating-form";
import { TitlePoster } from "@/components/title-poster";
import { WtfDropZone, TITLE_DRAG_TYPE } from "@/components/wtf-drop-zone";
import { WtfModal } from "@/components/wtf-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { decadeOf } from "@/lib/filters";
import type { CatalogTitle, Medium } from "@/lib/types";
import { useRef, useState } from "react";

type TitleStageProps = {
  title: CatalogTitle;
  watched?: boolean;
  onToggleWatch?: () => void;
  onWatchlist: (title: CatalogTitle) => void;
  onRated: (rating: number, comments: string) => void;
  onSkip: () => void;
  onQueue: () => void;
};

export function TitleStage({
  title,
  watched = false,
  onToggleWatch,
  onWatchlist,
  onRated,
  onSkip,
  onQueue,
}: TitleStageProps) {
  const [mode, setMode] = useState<"choose" | "rate">("choose");
  const [dragging, setDragging] = useState(false);
  const [dropArmed, setDropArmed] = useState(false);
  const [wtfOpen, setWtfOpen] = useState(false);
  const dragged = useRef(false);
  const medium: Medium = title.medium;
  const seenLabel = medium === "movie" ? "Seen It" : "Played It";
  const skipLabel = medium === "movie" ? "Haven't Seen It" : "Haven't Played It";
  const wantLabel = medium === "movie" ? "Want to See It" : "Want to Play It";

  const endDrag = () => {
    setDragging(false);
    setDropArmed(false);
  };

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Rate, skip, or park this title. Bookmark adds Watch without advancing. Drag the card onto
        WTF?? for a Wikipedia blurb — that does not log a result.
      </p>
      <Card
        className="relative overflow-visible border-none bg-card/80 ring-1 ring-white/10"
        draggable
        onDragStart={(event) => {
          if ((event.target as HTMLElement).closest("[data-card-chrome], button, input, textarea, a")) {
            event.preventDefault();
            return;
          }
          dragged.current = true;
          event.dataTransfer.setData(TITLE_DRAG_TYPE, title.id);
          event.dataTransfer.setData("text/plain", title.id);
          event.dataTransfer.effectAllowed = "copy";
          setDragging(true);
        }}
        onDragEnd={() => {
          requestAnimationFrame(endDrag);
        }}
      >
        <CardHeader className="gap-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
            <TitlePoster catalog={title} size="lg" className="mx-auto w-48 shrink-0 sm:mx-0" />
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <p className="text-xs font-medium tracking-widest text-amber-200/80 uppercase">
                  {medium === "movie" ? "Movie" : "Game"}
                </p>
                {onToggleWatch ? (
                  <CardIconBar placement="inline">
                    <BookmarkIconButton
                      active={watched}
                      label={watched ? `Remove ${title.title} from watchlist` : `Add ${title.title} to watchlist`}
                      onClick={onToggleWatch}
                    />
                  </CardIconBar>
                ) : null}
              </div>
              <CardTitle className="font-heading text-3xl leading-tight text-balance sm:text-4xl">
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
              <Button
                type="button"
                className="h-12 text-base"
                onClick={() => {
                  if (dragged.current) {
                    dragged.current = false;
                    return;
                  }
                  setMode("rate");
                }}
              >
                {seenLabel}
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="h-12 text-base"
                onClick={() => {
                  if (dragged.current) {
                    dragged.current = false;
                    return;
                  }
                  onSkip();
                }}
              >
                {skipLabel}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-12 text-base"
                onClick={() => {
                  if (dragged.current) {
                    dragged.current = false;
                    return;
                  }
                  onQueue();
                }}
              >
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

      {dragging ? (
        <WtfDropZone
          armed={dropArmed}
          onArmed={setDropArmed}
          onDropId={() => {
            endDrag();
            setWtfOpen(true);
          }}
        />
      ) : null}

      <WtfModal
        title={title}
        open={wtfOpen}
        onOpenChange={setWtfOpen}
        onWatchlist={onWatchlist}
      />
    </div>
  );
}
