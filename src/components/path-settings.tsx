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
import {
  defaultFilters,
  decadesFor,
  filtersComplete,
  GAME_GENRES,
  MOVIE_GENRES,
  OBSCURITY_LEVELS,
  STACK_SIZES,
  sanitizeFilters,
} from "@/lib/filters";
import { MPAA_RATINGS } from "@/lib/mpaa";
import { GAME_OBSCURITY_COPY, MOVIE_OBSCURITY_COPY } from "@/lib/obscurity";
import type { Medium, PathFilters, StackSize } from "@/lib/types";
import { useState } from "react";

type PathSettingsProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medium: Medium;
  filters: PathFilters;
  onSave: (filters: PathFilters) => void;
};

export function PathSettings({
  open,
  onOpenChange,
  medium,
  filters,
  onSave,
}: PathSettingsProps) {
  const [draft, setDraft] = useState<PathFilters>(() => sanitizeFilters(filters, medium));

  const genres = medium === "movie" ? MOVIE_GENRES : GAME_GENRES;
  const decades = decadesFor(medium);
  const obscurityCopy = medium === "game" ? GAME_OBSCURITY_COPY : MOVIE_OBSCURITY_COPY;
  const canClose = filtersComplete(draft, medium);
  const missing = missingGroups(draft, medium);

  const apply = (patch: Partial<PathFilters>) => {
    const nextFilters: PathFilters = {
      ...defaultFilters(medium),
      ...draft,
      ...patch,
    };
    setDraft(nextFilters);
    onSave(nextFilters);
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
          setDraft(sanitizeFilters(filters, medium));
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
            Filters apply to both Ranx and Tourney for {medium === "movie" ? "Movies" : "Games"}.
            Filter categories must have at least one selection.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-1">
          <fieldset className="space-y-2">
            <legend className="w-full">
              <GroupControls
                label="Decades"
                onCheckAll={() => apply({ decades: [...decades] })}
                onUncheckAll={() => apply({ decades: [] })}
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
                const id = `filter-decade-${decade}`;
                return (
                  <label key={decade} htmlFor={id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      id={id}
                      checked={draft.decades.includes(decade)}
                      onCheckedChange={() =>
                        apply({ decades: toggle(draft.decades, decade) as number[] })
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
                onCheckAll={() => apply({ genres: [...genres] })}
                onUncheckAll={() => apply({ genres: [] })}
              />
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {genres.map((genre) => {
                const id = `filter-genre-${genre}`;
                return (
                  <label key={genre} htmlFor={id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      id={id}
                      checked={draft.genres.includes(genre)}
                      onCheckedChange={() =>
                        apply({ genres: toggle(draft.genres, genre) as string[] })
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
                checked={draft.includeForeign !== false}
                onCheckedChange={(value) => apply({ includeForeign: value === true })}
                className="mt-0.5"
              />
              <span>
                <span className="font-medium">Include foreign / non-English films</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  Turn off for English-dialogue films only.
                </span>
              </span>
            </label>
          ) : null}

          <fieldset className="space-y-2">
            <legend className="w-full">
              <GroupControls
                label="Obscurity"
                onCheckAll={() => apply({ obscurity: [...OBSCURITY_LEVELS] })}
                onUncheckAll={() => apply({ obscurity: [] })}
              />
            </legend>
            <div className="grid gap-2">
              {OBSCURITY_LEVELS.map((level) => {
                const id = `filter-obscurity-${level}`;
                return (
                  <label key={level} htmlFor={id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      id={id}
                      checked={draft.obscurity.includes(level)}
                      onCheckedChange={() =>
                        apply({ obscurity: toggle(draft.obscurity, level) as number[] })
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
              How many titles to sample into this catalog’s deal for both Ranx and Tourney. Default
              is 50.
            </p>
            <div className="flex flex-wrap gap-2">
              {STACK_SIZES.map((size) => {
                const id = `filter-stack-${size}`;
                return (
                  <label
                    key={size}
                    htmlFor={id}
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-border/70 px-3 py-2 text-sm"
                  >
                    <input
                      id={id}
                      type="radio"
                      name="filter-stack-size"
                      className="accent-primary"
                      checked={draft.stackSize === size}
                      onChange={() => apply({ stackSize: size as StackSize })}
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
                  onCheckAll={() => apply({ mpaa: [...MPAA_RATINGS] })}
                  onUncheckAll={() => apply({ mpaa: [] })}
                />
              </legend>
              <p className="text-xs text-muted-foreground">
                Titles without a listed rating count as Not Rated.
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {MPAA_RATINGS.map((rating) => {
                  const id = `filter-mpaa-${rating}`;
                  return (
                    <label key={rating} htmlFor={id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        id={id}
                        checked={(draft.mpaa ?? []).includes(rating)}
                        onCheckedChange={() =>
                          apply({ mpaa: toggle(draft.mpaa ?? [], rating) as string[] })
                        }
                      />
                      {rating}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ) : null}
        </div>

        {canClose ? null : (
          <p className="text-sm text-muted-foreground" role="status">
            Still needs {missing.join(", ")}. Check at least one box in each group before Done.
          </p>
        )}
        <DialogFooter className="gap-2 sm:justify-between">
          <Button type="button" variant="ghost" onClick={() => apply(defaultFilters(medium))}>
            Reset filters
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
  if ((filters.decades?.length ?? 0) === 0) missing.push("Decades");
  if ((filters.genres?.length ?? 0) === 0) missing.push("Genre");
  if ((filters.obscurity?.length ?? 0) === 0) missing.push("Obscurity");
  if (medium === "movie" && (filters.mpaa?.length ?? 0) === 0) missing.push("MPAA Rating");
  return missing;
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
