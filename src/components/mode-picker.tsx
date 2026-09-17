"use client";

import { Button } from "@/components/ui/button";
import { Dices, ListOrdered } from "lucide-react";
import type { Medium } from "@/lib/types";

type ModePickerProps = {
  medium: Medium;
  onChoose: (mode: "rank" | "tourney") => void;
  onBack: () => void;
};

export function ModePicker({ medium, onChoose, onBack }: ModePickerProps) {
  const catalog = medium === "movie" ? "movies" : "games";

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-10 sm:px-6">
      <p className="text-sm font-medium tracking-wide text-amber-200/80 uppercase">
        {medium === "movie" ? "Movies" : "Games"}
      </p>
      <h1 className="mt-2 max-w-xl font-heading text-4xl leading-tight tracking-tight text-balance sm:text-5xl">
        Rank one at a time, or run a Tourney.
      </h1>
      <p className="mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
        Rank deals a single {catalog.slice(0, -1)}. Tourney puts two titles against each other; pick
        a winner to score or skip scoring, and the other lands in Discard.
      </p>
      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        <Button type="button" onClick={() => onChoose("rank")} className="h-14 w-full gap-2 text-base">
          <ListOrdered className="size-5" />
          Rank
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onChoose("tourney")}
          className="h-14 w-full gap-2 text-base"
        >
          <Dices className="size-5" />
          Tourney
        </Button>
      </div>
      <Button type="button" variant="ghost" className="mt-4 self-start" onClick={onBack}>
        Back to Movies or Games
      </Button>
    </section>
  );
}
