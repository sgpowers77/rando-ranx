"use client";

import { Button } from "@/components/ui/button";
import { Clapperboard, Gamepad2 } from "lucide-react";

type LandingProps = {
  onChoose: (medium: "movie" | "game") => void;
};

export function Landing({ onChoose }: LandingProps) {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-10 sm:px-6">
      <p className="text-sm font-medium tracking-wide text-amber-200/80 uppercase">
        Movies or Games, then Rank or Tourney
      </p>
      <h1 className="mt-2 max-w-xl font-heading text-4xl leading-tight tracking-tight text-balance sm:text-5xl">
        Rank a random title, or put two in a Tourney.
      </h1>
      <p className="mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
        Start with Movies or Games. Rank deals one title at a time. Tourney shows two; you pick a
        winner to score, and the other goes to Discard. The left-hand log keeps Results and Discard
        tabs. Print from the top-right icon.
      </p>
      <div className="mt-10 grid gap-3 sm:grid-cols-2">
        <Button
          type="button"
          onClick={() => onChoose("movie")}
          className="h-14 w-full gap-2 text-base"
        >
          <Clapperboard className="size-5" />
          Movies
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onChoose("game")}
          className="h-14 w-full gap-2 text-base"
        >
          <Gamepad2 className="size-5" />
          Games
        </Button>
      </div>
    </section>
  );
}
