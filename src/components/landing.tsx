"use client";

import { Button } from "@/components/ui/button";
import { catalogLabel } from "@/lib/medium";
import type { Medium } from "@/lib/types";
import { Clapperboard, Disc3, Gamepad2 } from "lucide-react";

type LandingProps = {
  onChoose: (medium: Medium) => void;
};

export function Landing({ onChoose }: LandingProps) {
  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-10 sm:px-6">
      <p className="text-sm font-medium tracking-wide text-primary uppercase">
        It&apos;s Showdown Time
      </p>
      <h1 className="mt-2 max-w-xl font-heading text-4xl leading-tight tracking-tight text-balance sm:text-5xl">
        Rank. Compare. Discover.
      </h1>
      <p className="mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
        Select a catalog and rate titles individually with Ranx, or put titles to the test in Tourney
        mode. Log your reviews and notes, save a watchlist, or queue up your own lists to rank and
        watch in RandoRanx.
      </p>
      <div className="mt-10 grid gap-3 sm:grid-cols-3">
        <Button
          type="button"
          onClick={() => onChoose("movie")}
          className="h-14 w-full gap-2 text-base"
        >
          <Clapperboard className="size-5" />
          {catalogLabel("movie")}
        </Button>
        <Button
          type="button"
          onClick={() => onChoose("game")}
          className="h-14 w-full gap-2 text-base"
        >
          <Gamepad2 className="size-5" />
          {catalogLabel("game")}
        </Button>
        <Button
          type="button"
          onClick={() => onChoose("music")}
          className="h-14 w-full gap-2 text-base"
        >
          <Disc3 className="size-5" />
          {catalogLabel("music")}
        </Button>
      </div>
    </section>
  );
}
