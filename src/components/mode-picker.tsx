"use client";

import { PathSettings } from "@/components/path-settings";
import { Button } from "@/components/ui/button";
import { defaultFilters } from "@/lib/filters";
import type { Medium, PathFilters, PlayMode } from "@/lib/types";
import { Dices, ListOrdered, SlidersHorizontal } from "lucide-react";
import { useState } from "react";

type ModePickerProps = {
  medium: Medium;
  filters: PathFilters;
  onChoose: (mode: PlayMode) => void;
  onSaveFilters: (filters: PathFilters) => void;
  onBack: () => void;
};

export function ModePicker({
  medium,
  filters,
  onChoose,
  onSaveFilters,
  onBack,
}: ModePickerProps) {
  const catalog = medium === "movie" ? "movies" : "games";
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 px-4 py-10 sm:px-6">
      <div>
        <p className="text-sm font-medium tracking-wide text-amber-200/80 uppercase">
          {medium === "movie" ? "Movies" : "Games"}
        </p>
        <h1 className="mt-2 max-w-xl font-heading text-4xl leading-tight tracking-tight text-balance sm:text-5xl">
          Ranx one at a time, or run a Tourney.
        </h1>
        <p className="mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
          Ranx deals a single {catalog.slice(0, -1)}. Tourney puts two titles against each other. After
          you pick a mode, Wikipedia search can Queue titles you choose — never as an automated deal.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Button type="button" onClick={() => onChoose("rank")} className="h-14 w-full gap-2 text-base">
          <ListOrdered className="size-5" />
          Ranx
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
      <Button
        type="button"
        variant="outline"
        className="self-start gap-2"
        aria-label="Filters"
        onClick={() => setSettingsOpen(true)}
      >
        <SlidersHorizontal className="size-4" />
        Filters
      </Button>
      <Button type="button" variant="ghost" className="self-start" onClick={onBack}>
        Back to Movies or Games
      </Button>
      <PathSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        medium={medium}
        filters={filters ?? defaultFilters(medium)}
        onSave={onSaveFilters}
      />
    </section>
  );
}
