"use client";

import { BookmarkIconButton, CardIconBar, StarIconButton } from "@/components/card-icon-bar";
import { RatingForm } from "@/components/rating-form";
import { TitlePoster } from "@/components/title-poster";
import { WtfDropZone, TITLE_DRAG_TYPE } from "@/components/wtf-drop-zone";
import { WtfModal } from "@/components/wtf-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TitleDirector } from "@/hooks/use-director";
import { decadeOf } from "@/lib/filters";
import type { CatalogTitle, RatingExtras } from "@/lib/types";
import { SkipForward, Undo2 } from "lucide-react";
import { useRef, useState } from "react";

type TourneyStageProps = {
  pair: [CatalogTitle, CatalogTitle];
  onPick: (winnerId: string, loserId: string, extras?: RatingExtras) => void;
  onWatchlist: (title: CatalogTitle) => void;
  onToggleWatch: (title: CatalogTitle) => void;
  watchedIds: string[];
  onReshufflePair: () => void;
  onUndo?: () => void;
  undoCount?: number;
  isFinalRound?: boolean;
};

const DRAG_TYPE = TITLE_DRAG_TYPE;

export function TourneyUndoButton({
  onUndo,
  undoCount = 0,
}: {
  onUndo?: () => void;
  undoCount?: number;
}) {
  const disabled = !onUndo || undoCount < 1;
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      className="h-9 gap-1.5 self-start"
      disabled={disabled}
      aria-disabled={disabled}
      aria-label="Undo last Select"
      title="Undo last Select, up to three times"
      onClick={() => {
        if (disabled || !onUndo) return;
        onUndo();
      }}
    >
      <Undo2 className="size-4" />
      Undo
    </Button>
  );
}

export function TourneyStage({
  pair,
  onPick,
  onWatchlist,
  onToggleWatch,
  watchedIds,
  onReshufflePair,
  onUndo,
  undoCount = 0,
  isFinalRound = false,
}: TourneyStageProps) {
  const [left, right] = pair;
  const [dragging, setDragging] = useState(false);
  const [dropArmed, setDropArmed] = useState(false);
  const [wtfTitle, setWtfTitle] = useState<CatalogTitle | null>(null);
  const [notes, setNotes] = useState<Record<string, RatingExtras>>({});
  const dragged = useRef(false);

  const endDrag = () => {
    setDragging(false);
    setDropArmed(false);
  };

  const select = (winner: CatalogTitle, loser: CatalogTitle) => {
    onPick(winner.id, loser.id, notes[winner.id]);
  };

  return (
    <div className="space-y-3">
      {isFinalRound ? (
        <p className="hidden rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm lg:block">
          Final Round. Vote among logged Contenders until one champion remains. Losers still go to
          Discard. WTF?? and Watch work the same as Tourney.
        </p>
      ) : null}
      <p className="hidden text-xs text-muted-foreground lg:block">
        Select a Contender. Star adds an optional score. Bookmark adds Watch without voting. Drag a
        card onto WTF?? for a Wikipedia blurb — that does not count as a pick.
      </p>
      <TourneyUndoButton onUndo={onUndo} undoCount={undoCount} />
      <div className="grid grid-cols-2 items-stretch gap-2 lg:gap-3">
        <MatchupCard
          title={left}
          notes={notes[left.id]}
          watched={watchedIds.includes(left.id)}
          draggedRef={dragged}
          onSelect={() => select(left, right)}
          onToggleWatch={() => onToggleWatch(left)}
          onSaveNotes={(extras) => setNotes((prev) => ({ ...prev, [left.id]: extras }))}
          onDragBegin={() => setDragging(true)}
          onDragEnd={() => {
            requestAnimationFrame(endDrag);
          }}
        />
        <MatchupCard
          title={right}
          notes={notes[right.id]}
          watched={watchedIds.includes(right.id)}
          draggedRef={dragged}
          onSelect={() => select(right, left)}
          onToggleWatch={() => onToggleWatch(right)}
          onSaveNotes={(extras) => setNotes((prev) => ({ ...prev, [right.id]: extras }))}
          onDragBegin={() => setDragging(true)}
          onDragEnd={() => {
            requestAnimationFrame(endDrag);
          }}
        />
      </div>
      <div className="space-y-2 pt-1">
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full gap-2 text-base"
          aria-label="Skip both titles"
          onClick={onReshufflePair}
        >
          <SkipForward className="size-4" />
          Skip
        </Button>
        <p className="hidden text-center text-xs text-muted-foreground lg:block">
          Skip both titles without picking a winner and deal a new pair. They will not show up again
          right away.
        </p>
      </div>

      {dragging ? (
        <WtfDropZone
          armed={dropArmed}
          onArmed={setDropArmed}
          onDropId={(id) => {
            const dropped = pair.find((item) => item.id === id) ?? null;
            endDrag();
            if (dropped) setWtfTitle(dropped);
          }}
        />
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
  notes,
  watched,
  onSelect,
  onToggleWatch,
  onSaveNotes,
  onDragBegin,
  onDragEnd,
  draggedRef,
}: {
  title: CatalogTitle;
  notes?: RatingExtras;
  watched: boolean;
  onSelect: () => void;
  onToggleWatch: () => void;
  onSaveNotes: (extras: RatingExtras) => void;
  onDragBegin: () => void;
  onDragEnd: () => void;
  draggedRef: { current: boolean };
}) {
  const [rateOpen, setRateOpen] = useState(false);

  return (
    <Card
      className="relative flex h-full flex-col overflow-visible border-none bg-card/80 ring-1 ring-white/10"
      draggable
      onDragStart={(event) => {
        if ((event.target as HTMLElement).closest("[data-card-chrome], button, a")) {
          event.preventDefault();
          return;
        }
        draggedRef.current = true;
        event.dataTransfer.setData(DRAG_TYPE, title.id);
        event.dataTransfer.setData("text/plain", title.id);
        event.dataTransfer.effectAllowed = "copy";
        onDragBegin();
      }}
      onDragEnd={onDragEnd}
    >
      <div className="relative mx-auto h-40 w-[6.67rem] shrink-0 lg:h-96 lg:w-64">
        <TitlePoster catalog={title} size="tourney" showCredit={false} className="block h-full w-full" />
        <CardIconBar>
          <StarIconButton
            active={Boolean(notes)}
            label={`Rate and comment on ${title.title}`}
            onClick={() => {
              draggedRef.current = false;
              setRateOpen(true);
            }}
          />
          <BookmarkIconButton
            active={watched}
            label={watched ? `Remove ${title.title} from watchlist` : `Add ${title.title} to watchlist`}
            onClick={() => {
              draggedRef.current = false;
              onToggleWatch();
            }}
          />
        </CardIconBar>
      </div>
      <CardHeader className="flex min-h-0 flex-1 flex-col gap-1 px-2 pt-2 lg:gap-2 lg:px-4 lg:pr-4">
        <p className="hidden text-xs font-medium tracking-widest text-primary uppercase lg:block">
          {title.medium === "movie" ? "Movie" : "Game"}
        </p>
        <CardTitle className="font-heading line-clamp-2 min-h-[2.5rem] text-sm leading-tight text-balance lg:min-h-[4.5rem] lg:text-3xl">
          {title.title}
        </CardTitle>
        <TitleDirector
          title={title}
          className="line-clamp-1 h-4 text-[11px] text-muted-foreground lg:h-5 lg:text-sm"
        />
        <CardDescription className="text-[11px] lg:text-base">
          {title.year} · {decadeOf(title.year)}s
          {notes?.rating != null ? ` · ${notes.rating}/10 saved` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto shrink-0 px-2 pb-2 lg:px-4 lg:pb-4">
        <Button
          type="button"
          className="h-9 w-full text-sm lg:h-12 lg:text-base"
          onClick={() => {
            if (draggedRef.current) {
              draggedRef.current = false;
              return;
            }
            onSelect();
          }}
        >
          Select
        </Button>
      </CardContent>
      <Dialog open={rateOpen} onOpenChange={setRateOpen}>
        <DialogContent className="sm:max-w-lg" showCloseButton>
          <DialogHeader>
            <DialogTitle>
              Rate {title.title}
            </DialogTitle>
            <DialogDescription>
              Optional. Save a 1–10 score and comment, then Select this card if it is your Contender.
              Close with X or by clicking outside.
            </DialogDescription>
          </DialogHeader>
          <RatingForm
            medium={title.medium}
            className="space-y-5"
            hideCancel
            initialRating={notes?.rating}
            initialComments={notes?.comments}
            initialWatchedDate={notes?.watchedDate}
            submitLabel="Save"
            onCancel={() => setRateOpen(false)}
            onSubmit={(rating, comments, watchedDate) => {
              onSaveNotes({ rating, comments, watchedDate });
              setRateOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
