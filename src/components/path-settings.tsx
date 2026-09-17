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
import { DECADES, defaultFilters, filtersComplete, GAME_GENRES, MOVIE_GENRES, OBSCURITY_LEVELS } from "@/lib/filters";
import type { Medium, PathFilters, PlayMode } from "@/lib/types";
import { useState } from "react";

type PathSettingsProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medium: Medium;
  filtersByMode: Record<PlayMode, PathFilters>;
  onSave: (playMode: PlayMode, filters: PathFilters) => void;
};

const OBSCURITY_COPY: Record<number, string> = {
  1: "1 · Blockbuster / household name",
  2: "2 · Widely seen",
  3: "3 · Known if you follow the medium",
  4: "4 · Cult / limited release",
  5: "5 · Extremely obscure indie",
};

export function PathSettings({
  open,
  onOpenChange,
  medium,
  filtersByMode,
  onSave,
}: PathSettingsProps) {
  const [mode, setMode] = useState<PlayMode>("rank");
  const [draft, setDraft] = useState<Record<PlayMode, PathFilters>>(filtersByMode);

  const genres = medium === "movie" ? MOVIE_GENRES : GAME_GENRES;
  const current = draft[mode];
  const canClose = filtersComplete(draft.rank) && filtersComplete(draft.tourney);
  const rankMissing = missingGroups(draft.rank);
  const tourneyMissing = missingGroups(draft.tourney);

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
          setDraft(filtersByMode);
          onOpenChange(true);
          return;
        }
        if (!canClose) return;
        onOpenChange(false);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg" showCloseButton={canClose}>
        <DialogHeader>
          <DialogTitle>Path settings</DialogTitle>
          <DialogDescription>
            Filters apply separately to Rank and Tourney for{" "}
            {medium === "movie" ? "Movies" : "Games"}. Each of Year, Genre, and Obscurity needs at
            least one box checked on both paths. Unchecked boxes drop those titles from the deal
            right away. Done stays off until every group has a selection.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(value) => setMode(value as PlayMode)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="rank">Rank</TabsTrigger>
            <TabsTrigger value="tourney">Tourney</TabsTrigger>
          </TabsList>
          <TabsContent value={mode} className="space-y-5 pt-4">
            <fieldset className="space-y-2">
              <legend className="w-full">
                <GroupControls
                  label="Year"
                  onCheckAll={() => applyMode(mode, { decades: [...DECADES] })}
                  onUncheckAll={() => applyMode(mode, { decades: [] })}
                />
              </legend>
              <p className="text-xs text-muted-foreground">
                Decade uses the Wikipedia / Wikidata release year (same source as search and blurbs).
                Local catalog years are only a fallback. Unchecked decades are left out of Rank and
                Tourney. Keep at least one decade checked.
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {DECADES.map((decade) => {
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

            <fieldset className="space-y-2">
              <legend className="w-full">
                <GroupControls
                  label="Obscurity"
                  onCheckAll={() => applyMode(mode, { obscurity: [...OBSCURITY_LEVELS] })}
                  onUncheckAll={() => applyMode(mode, { obscurity: [] })}
                />
              </legend>
              <p className="text-xs text-muted-foreground">
                1 is a Hollywood-scale blockbuster. 5 is extremely obscure indie / low exposure.
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
                      {OBSCURITY_COPY[level]}
                    </label>
                  );
                })}
              </div>
            </fieldset>
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
          <Button type="button" disabled={!canClose} onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function missingGroups(filters: PathFilters): string[] {
  const missing: string[] = [];
  if ((filters.decades?.length ?? 0) === 0) missing.push("Year");
  if ((filters.genres?.length ?? 0) === 0) missing.push("Genre");
  if ((filters.obscurity?.length ?? 0) === 0) missing.push("Obscurity");
  return missing;
}

function closeBlockedCopy(rankMissing: string[], tourneyMissing: string[]): string {
  const parts: string[] = [];
  if (rankMissing.length > 0) parts.push(`Rank still needs ${rankMissing.join(", ")}`);
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
