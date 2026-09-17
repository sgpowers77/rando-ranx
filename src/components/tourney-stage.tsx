"use client";

import { BookmarkIconButton, CardIconBar, StarIconButton } from "@/components/card-icon-bar";
import { RatingForm } from "@/components/rating-form";
import { TitlePoster } from "@/components/title-poster";
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
import { decadeOf } from "@/lib/filters";
import type { CatalogTitle } from "@/lib/types";
import { Shuffle, Undo2 } from "lucide-react";
import { useRef, useState } from "react";

type TourneyStageProps = {
  pair: [CatalogTitle, CatalogTitle];
  onPick: (winnerId: string, loserId: string, extras?: { rating?: number; comments?: string }) => void;
  onWatchlist: (title: CatalogTitle) => void;
  onToggleWatch: (title: CatalogTitle) => void;
  watchedIds: string[];
  onReshufflePair: () => void;
  onUndo?: () => void;
  undoCount?: number;
  isFinalRound?: boolean;
};

const DRAG_TYPE = "application/x-randoranx-title";

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
  const [notes, setNotes] = useState<Record<string, { rating: number; comments: string }>>({});
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
        <p className="rounded-xl border border-amber-200/30 bg-amber-200/10 px-4 py-3 text-sm">
          Final Round. Vote among logged Contenders until one champion remains. Losers still go to
          Discard. WTF?? and Watch work the same as Tourney.
        </p>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Select a Contender. Star adds an optional score. Bookmark adds Watch without voting. Drag a
        card onto WTF?? for a Wikipedia blurb — that does not count as a pick.
      </p>
      <div className="grid items-stretch gap-3 sm:grid-cols-2">
        <MatchupCard
          title={left}
          notes={notes[left.id]}
          watched={watchedIds.includes(left.id)}
          draggedRef={dragged}
          onSelect={() => select(left, right)}
          onToggleWatch={() => onToggleWatch(left)}
          onSaveNotes={(rating, comments) =>
            setNotes((prev) => ({ ...prev, [left.id]: { rating, comments } }))
          }
          onDragBegin={() => setDragging(true)}
          onDragEnd={endDrag}
        />
        <MatchupCard
          title={right}
          notes={notes[right.id]}
          watched={watchedIds.includes(right.id)}
          draggedRef={dragged}
          onSelect={() => select(right, left)}
          onToggleWatch={() => onToggleWatch(right)}
          onSaveNotes={(rating, comments) =>
            setNotes((prev) => ({ ...prev, [right.id]: { rating, comments } }))
          }
          onDragBegin={() => setDragging(true)}
          onDragEnd={endDrag}
        />
      </div>
      <div className="space-y-2 pt-1">
        {undoCount > 0 && onUndo ? (
          <Button type="button" variant="secondary" className="h-11 w-full gap-2 text-base" onClick={onUndo}>
            <Undo2 className="size-4" />
            Back
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          className="h-11 w-full gap-2 text-base"
          onClick={onReshufflePair}
        >
          <Shuffle className="size-4" />
          Reshuffle
        </Button>
        <p className="text-center text-xs text-muted-foreground">
          Skip both titles without picking a winner and deal a new pair. They will not show up again
          right away.
        </p>
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
  notes?: { rating: number; comments: string };
  watched: boolean;
  onSelect: () => void;
  onToggleWatch: () => void;
  onSaveNotes: (rating: number, comments: string) => void;
  onDragBegin: () => void;
  onDragEnd: () => void;
  draggedRef: { current: boolean };
}) {
  const [rateOpen, setRateOpen] = useState(false);

  return (
    <Card
      className="relative h-full overflow-visible border-none bg-card/80 ring-1 ring-white/10"
      draggable
      onDragStart={(event) => {
        if ((event.target as HTMLElement).closest("[data-card-chrome]")) {
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
      <CardHeader className="flex-1 gap-2 pr-20">
        <TitlePoster catalog={title} size="md" />
        <p className="text-xs font-medium tracking-widest text-amber-200/80 uppercase">
          {title.medium === "movie" ? "Movie" : "Game"}
        </p>
        <CardTitle className="font-heading text-2xl leading-tight text-balance sm:text-3xl">
          {title.title}
        </CardTitle>
        <CardDescription className="text-base">
          {title.year} · {decadeOf(title.year)}s
          {notes ? ` · ${notes.rating}/10 saved` : ""}
        </CardDescription>
      </CardHeader>
      <CardContent className="mt-auto">
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
            submitLabel="Save"
            onCancel={() => setRateOpen(false)}
            onSubmit={(rating, comments) => {
              onSaveNotes(rating, comments);
              setRateOpen(false);
            }}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
}
