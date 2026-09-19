"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { parseWatchedDate } from "@/lib/director";
import type { Medium } from "@/lib/types";
import { useState } from "react";

type RatingFormProps = {
  medium: Medium;
  onSubmit: (rating: number, comments: string, watchedDate?: string) => void;
  onCancel: () => void;
  initialRating?: number;
  initialComments?: string;
  initialWatchedDate?: string;
  submitLabel?: string;
  cancelLabel?: string;
  className?: string;
  hideCancel?: boolean;
};

export function RatingForm({
  medium,
  onSubmit,
  onCancel,
  initialRating,
  initialComments = "",
  initialWatchedDate = "",
  submitLabel = "Next",
  cancelLabel = "Back to choices",
  className,
  hideCancel = false,
}: RatingFormProps) {
  const [rating, setRating] = useState<number | null>(initialRating ?? null);
  const [comments, setComments] = useState(initialComments);
  const [watchedDate, setWatchedDate] = useState(parseWatchedDate(initialWatchedDate) ?? "");

  const verb = medium === "movie" ? "this movie" : medium === "music" ? "this album" : "this game";

  return (
    <form
      className={className ?? "mt-6 space-y-5"}
      onSubmit={(event) => {
        event.preventDefault();
        if (rating == null) return;
        onSubmit(rating, comments, parseWatchedDate(watchedDate));
      }}
    >
      <div>
        <p className="text-sm font-medium">Rate it from 1 to 10</p>
        <p className="mt-1 text-sm text-muted-foreground">
          1 is a hard pass. 10 is something you would recommend without hedging.
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
                onClick={() => setRating(value)}
                className="h-11 w-full text-base tabular-nums"
              >
                {value}
              </Button>
            );
          })}
        </div>
      </div>
      {medium === "movie" ? (
        <div className="space-y-2">
          <label htmlFor="watch-date" className="text-sm font-medium">
            Watch date
          </label>
          <Input
            id="watch-date"
            type="date"
            value={watchedDate}
            onChange={(event) => setWatchedDate(event.target.value)}
            className="h-11 max-w-56"
          />
          <p className="text-xs text-muted-foreground">
            Optional. Saved with this rating and written to Letterboxd CSV as WatchedDate when set.
          </p>
        </div>
      ) : null}
      <div className="space-y-2">
        <label htmlFor="comments" className="text-sm font-medium">
          Comments
        </label>
        <Textarea
          id="comments"
          value={comments}
          onChange={(event) => setComments(event.target.value)}
          placeholder={`What stuck with you about ${verb}? Optional.`}
          className="min-h-28 resize-y"
        />
      </div>
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        {hideCancel ? null : (
          <Button type="button" variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </Button>
        )}
        <Button type="submit" disabled={rating == null} className="sm:min-w-28">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
