"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { defaultFilters, decadesFor, filtersComplete, GAME_GENRES, MOVIE_GENRES, OBSCURITY_LEVELS, STACK_SIZES, sanitizeFilters } from "@/lib/filters";
import { MPAA_RATINGS } from "@/lib/mpaa";
import { GAME_OBSCURITY_COPY, MOVIE_OBSCURITY_COPY } from "@/lib/obscurity";
import type { Medium, PathFilters, PlayMode, StackSize } from "@/lib/types";
import { useState } from "react";

type PathSettingsProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medium: Medium;
  filtersByMode: Record<PlayMode, PathFilters>;
  onSave: (playMode: PlayMode, filters: PathFilters) => void;
};

export function PathSettings({
  open,
  onOpenChange,
  medium,
  filtersByMode,
  onSave,
}: PathSettingsProps) {
  const [mode, setMode] = useState<PlayMode>("rank");
  const [draft, setDraft] = useState<Record<PlayMode, PathFilters>>({
    rank: sanitizeFilters(filtersByMode.rank, medium),
    tourney: sanitizeFilters(filtersByMode.tourney, medium),
  });

  const genres = medium === "movie" ? MOVIE_GENRES : GAME_GENRES;
  const decades = decadesFor(medium);
  const obscurityCopy = medium === "game" ? GAME_OBSCURITY_COPY : MOVIE_OBSCURITY_COPY;
  const current = draft[mode];
  const canClose = filtersComplete(draft.rank, medium) && filtersComplete(draft.tourney, medium);
  const rankMissing = missingGroups(draft.rank, medium);
  const tourneyMissing = missingGroups(draft.tourney, medium);

  const applyMode = (playMode: PlayMode, patch: Partial<PathFilters>) => {
    const nextFilters: PathFilters = {
      ...defaultFilters(medium),
      ...draft[playMode],
      ...patch,
    };
    setDraft((prev) => ({ ...prev, [playMode]: nextFilters }));
    onSave(playMode, nextFilters);
  };

  const toggle = (list: number[] | string[], value: number | string) => {
    if (list.includes(value as never)) return list.filter((item) => item !== value);
    return [...list, value];
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setDraft({
            rank: sanitizeFilters(filtersByMode.rank, medium),
            tourney: sanitizeFilters(filtersByMode.tourney, medium),
          });
          onOpenChange(true);
          return;
        }
        if (!canClose) return;
        onOpenChange(false);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" showCloseButton={canClose}>
        <DialogHeader>
          <DialogTitle>Filters</DialogTitle>
          <DialogDescription>
            Filters apply separately to Ranx and Tourney for{" "}
            {medium === "movie" ? "Movies" : "Games"}. Each of Year, Genre, Obscurity
            {medium === "movie" ? ", and MPAA Rating" : ""} needs at
            least one box checked on both paths. Unchecked boxes drop those titles from the deal
            right away. Done stays off until every group has a selection.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(value) => setMode(value as PlayMode)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rank">Ranx</TabsTrigger>
            <TabsTrigger value="tourney">Tourney</TabsTrigger>
          </TabsList>
          <TabsContent value={mode} className="space-y-5 pt-4">
            <fieldset className="space-y-2">
              <legend className="w-full">
                <GroupControls
                  label="Year"
                  onCheckAll={() => applyMode(mode, { decades: [...decades] })}
                  onUncheckAll={() => applyMode(mode, { decades: [] })}
                />
              </legend>
              <p className="text-xs text-muted-foreground">
                Decade uses the Wikipedia / Wikidata release year (same source as search and blurbs).
                {medium === "game"
                  ? " Games start at the 1970s — there is no 1960s or earlier bucket."
                  : " Local catalog years are only a fallback."}{" "}
                Unchecked decades are left out of Ranx and Tourney. Keep at least one decade checked.
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {decades.map((decade) => {
                  const id = `${mode}-decade-${decade}`;
                  const checked = current.decades.includes(decade);
                  return (
                    <label key={decade} htmlFor={id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        id={id}
                        checked={checked}
                        onCheckedChange={() =>
                          applyMode(mode, {
                            decades: toggle(current.decades, decade) as number[],
                          })
                        }
                      />
                      {decade}s
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="w-full">
                <GroupControls
                  label="Genre"
                  onCheckAll={() => applyMode(mode, { genres: [...genres] })}
                  onUncheckAll={() => applyMode(mode, { genres: [] })}
                />
              </legend>
              <div className="grid grid-cols-2 gap-2">
                {genres.map((genre) => {
                  const id = `${mode}-genre-${genre}`;
                  return (
                    <label key={genre} htmlFor={id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        id={id}
                        checked={current.genres.includes(genre)}
                        onCheckedChange={() =>
                          applyMode(mode, {
                            genres: toggle(current.genres, genre) as string[],
                          })
                        }
                      />
                      {genre}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {medium === "movie" ? (
              <label className="flex items-start gap-3 rounded-lg border border-border/70 px-3 py-3 text-sm">
                <Checkbox
                  checked={current.includeForeign !== false}
                  onCheckedChange={(value) => applyMode(mode, { includeForeign: value === true })}
                  className="mt-0.5"
                />
                <span>
                  <span className="font-medium">Include foreign / non-English films</span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    On by default. Turn off to deal only English-dialogue films (original language
                    English, or English listed in spoken languages from The Movies Dataset).
                  </span>
                </span>
              </label>
            ) : null}

            <fieldset className="space-y-2">
              <legend className="w-full">
                <GroupControls
                  label="Obscurity"
                  onCheckAll={() => applyMode(mode, { obscurity: [...OBSCURITY_LEVELS] })}
                  onUncheckAll={() => applyMode(mode, { obscurity: [] })}
                />
              </legend>
              <p className="text-xs text-muted-foreground">
                {medium === "game"
                  ? "1 is an AAA+ blockbuster. 5 is a micro-indie / ultra obscure release."
                  : "1 is wide-release / high exposure. 5 is little-seen. Ranked from The Movies Dataset: production budget, marketing/exposure (popularity and box-office revenue), public sentiment (vote average), and attention (vote count). Director names are not in the catalog, so vote volume stands in for prestige."}
              </p>
              <div className="grid gap-2">
                {OBSCURITY_LEVELS.map((level) => {
                  const id = `${mode}-obscurity-${level}`;
                  return (
                    <label key={level} htmlFor={id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        id={id}
                        checked={current.obscurity.includes(level)}
                        onCheckedChange={() =>
                          applyMode(mode, {
                            obscurity: toggle(current.obscurity, level) as number[],
                          })
                        }
                      />
                      {obscurityCopy[level]}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">Stack size</legend>
              <p className="text-xs text-muted-foreground">
                How many titles to sample into this path’s deal. Default is 50 (nearest to the old
                ~40-title Tourney stack).
              </p>
              <div className="flex flex-wrap gap-2">
                {STACK_SIZES.map((size) => {
                  const id = `${mode}-stack-${size}`;
                  const checked = current.stackSize === size;
                  return (
                    <label
                      key={size}
                      htmlFor={id}
                      className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm"
                    >
                      <input
                        id={id}
                        type="radio"
                        name={`${mode}-stack-size`}
                        className="accent-primary"
                        checked={checked}
                        onChange={() => applyMode(mode, { stackSize: size as StackSize })}
                      />
                      {size}
                    </label>
                  );
                })}
              </div>
            </fieldset>

            {medium === "movie" ? (
              <fieldset className="space-y-2">
                <legend className="w-full">
                  <GroupControls
                    label="MPAA Rating"
                    onCheckAll={() => applyMode(mode, { mpaa: [...MPAA_RATINGS] })}
                    onUncheckAll={() => applyMode(mode, { mpaa: [] })}
                  />
                </legend>
                <p className="text-xs text-muted-foreground">
                  Uses Wikidata MPA film ratings when known. Titles without a listed rating count as
                  Not Rated.
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {MPAA_RATINGS.map((rating) => {
                    const id = `${mode}-mpaa-${rating}`;
                    return (
                      <label key={rating} htmlFor={id} className="flex items-center gap-2 text-sm">
                        <Checkbox
                          id={id}
                          checked={(current.mpaa ?? []).includes(rating)}
                          onCheckedChange={() =>
                            applyMode(mode, {
                              mpaa: toggle(current.mpaa ?? [], rating) as string[],
                            })
                          }
                        />
                        {rating}
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            ) : null}
          </TabsContent>
        </Tabs>

        {canClose ? null : (
          <p className="text-sm text-muted-foreground" role="status">
            {closeBlockedCopy(rankMissing, tourneyMissing)}
          </p>
        )}
        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={() => applyMode(mode, defaultFilters(medium))}
          >
            Reset this path
          </Button>
          <Button
            type="button"
            disabled={!canClose}
            aria-disabled={!canClose}
            onClick={() => {
              if (!canClose) return;
              onOpenChange(false);
            }}
          >
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function missingGroups(filters: PathFilters, medium: Medium): string[] {
  const missing: string[] = [];
  if ((filters.decades?.length ?? 0) === 0) missing.push("Year");
  if ((filters.genres?.length ?? 0) === 0) missing.push("Genre");
  if ((filters.obscurity?.length ?? 0) === 0) missing.push("Obscurity");
  if (medium === "movie" && (filters.mpaa?.length ?? 0) === 0) missing.push("MPAA Rating");
  return missing;
}

function closeBlockedCopy(rankMissing: string[], tourneyMissing: string[]): string {
  const parts: string[] = [];
  if (rankMissing.length > 0) parts.push(`Ranx still needs ${rankMissing.join(", ")}`);
  if (tourneyMissing.length > 0) parts.push(`Tourney still needs ${tourneyMissing.join(", ")}`);
  return `${parts.join(". ")}. Check at least one box in each group before Done.`;
}

function GroupControls({
  label,
  onCheckAll,
  onUncheckAll,
}: {
  label: string;
  onCheckAll: () => void;
  onUncheckAll: () => void;
}) {
  return (
    <span className="flex flex-wrap items-center justify-between gap-2">
      <span className="text-sm font-medium">{label}</span>
      <span className="flex gap-1">
        <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={onCheckAll}>
          Check all
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={onUncheckAll}
        >
          Uncheck all
        </Button>
      </span>
    </span>
  );
}
