"use client";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Clapperboard, Gamepad2, Settings } from "lucide-react";
import { useState } from "react";

type LandingProps = {
  onChoose: (medium: "movie" | "game") => void;
  onResetAll: () => void;
};

export function Landing({ onChoose, onResetAll }: LandingProps) {
  const [resetOpen, setResetOpen] = useState(false);

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-4 py-10 sm:px-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium tracking-wide text-amber-200/80 uppercase">
          It&apos;s Showdown Time
        </p>
        <DropdownMenu>
          <DropdownMenuTrigger
            nativeButton={false}
            render={
              <Button
                type="button"
                variant="outline"
                size="icon-lg"
                aria-label="Home settings"
              />
            }
          >
            <Settings />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setResetOpen(true)}>Reset all</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <h1 className="mt-2 max-w-xl font-heading text-4xl leading-tight tracking-tight text-balance sm:text-5xl">
        Rank. Compare. Discover.
      </h1>
      <p className="mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
        Select a media and rate titles individually with Ranx, or put titles to the test in Tourney
        mode. Log your reviews and notes, save a watchlist, or queue up your own lists to rank and
        watch in RandoRanx.
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

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all progress?</AlertDialogTitle>
            <AlertDialogDescription>
              This clears your results log, Discard pile, Watch tags, Queue, remembered Tourney skip,
              path filters, and searched titles. The built-in catalog stays. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my progress</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onResetAll();
                setResetOpen(false);
              }}
            >
              Reset all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
