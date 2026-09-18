"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import type { ResponseKind, SessionResponse } from "@/lib/types";
import { useState } from "react";

type EntryEditorProps = {
  entry: SessionResponse;
  onSave: (kind: ResponseKind, extras: { rating?: number; comments: string }) => void;
  onCancel: () => void;
};

export function EntryEditor({ entry, onSave, onCancel }: EntryEditorProps) {
  const [kind, setKind] = useState<ResponseKind>(entry.kind);
  const [rating, setRating] = useState<number | null>(entry.rating ?? null);
  const [comments, setComments] = useState(entry.comments ?? "");
  const [saved, setSaved] = useState(false);

  const medium = entry.medium;
  const seenLabel = medium === "movie" ? "Seen It" : "Played It";
  const skipLabel = medium === "movie" ? "Haven't Seen It" : "Haven't Played It";
  const wantLabel = medium === "movie" ? "Want to See It" : "Want to Play It";

  const canSave = kind !== "rated" || rating != null;

  return (
    <Card className="border-none bg-card/80 ring-1 ring-white/10">
      <CardHeader className="gap-3">
        <p className="text-xs font-medium tracking-widest text-primary uppercase">
          Editing {medium === "movie" ? "movie" : "game"}
        </p>
        <CardTitle className="font-heading text-3xl leading-tight text-balance sm:text-4xl">
          {entry.title}
        </CardTitle>
        <CardDescription className="text-base text-muted-foreground">{entry.year}</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="space-y-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (!canSave) return;
            onSave(kind, {
              rating: kind === "rated" ? rating ?? undefined : undefined,
              comments,
            });
            setSaved(true);
          }}
        >
          <div className="grid gap-2">
            <ActionChoice
              label={seenLabel}
              selected={kind === "rated"}
              onSelect={() => {
                setKind("rated");
                setSaved(false);
              }}
            />
            <ActionChoice
              label={skipLabel}
              selected={kind === "skipped"}
              onSelect={() => {
                setKind("skipped");
                setSaved(false);
              }}
            />
            <ActionChoice
              label={wantLabel}
              selected={kind === "queued"}
              onSelect={() => {
                setKind("queued");
                setSaved(false);
              }}
            />
            <ActionChoice
              label="Contender (no score)"
              selected={kind === "winner"}
              onSelect={() => {
                setKind("winner");
                setSaved(false);
              }}
            />
          </div>

          {kind === "rated" ? (
            <div>
              <p className="text-sm font-medium">Rate it from 1 to 10</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Change the score if this title landed differently than you first thought.
              </p>
              <div className="mt-3 grid grid-cols-5 gap-2 sm:grid-cols-10">
                {Array.from({ length: 10 }, (_, index) => index + 1).map((value) => {
                  const selected = rating === value;
                  return (
                    <Button
                      key={value}
                      type="button"
                      variant={selected ? "default" : "outline"}
                      aria-pressed={selected}
                      aria-label={`Rate ${value} out of 10`}
                      onClick={() => {
                        setRating(value);
                        setSaved(false);
                      }}
                      className="h-11 w-full text-base tabular-nums"
                    >
                      {value}
                    </Button>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="space-y-2">
            <label htmlFor="edit-comments" className="text-sm font-medium">
              Comments
            </label>
            <Textarea
              id="edit-comments"
              value={comments}
              onChange={(event) => {
                setComments(event.target.value);
                setSaved(false);
              }}
              placeholder="Optional notes for this title."
              className="min-h-28 resize-y"
            />
          </div>

          {saved ? (
            <p className="text-sm text-muted-foreground" role="status">
              Saved. Pick another log item, or return to the current deal.
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={onCancel}>
              Back to current deal
            </Button>
            <Button type="submit" disabled={!canSave} className="sm:min-w-28">
              Save
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function ActionChoice({
  label,
  selected,
  onSelect,
}: {
  label: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Button
      type="button"
      variant={selected ? "default" : "outline"}
      aria-pressed={selected}
      className="h-12 text-base"
      onClick={onSelect}
    >
      {label}
    </Button>
  );
}
