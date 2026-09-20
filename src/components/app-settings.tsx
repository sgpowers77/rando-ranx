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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadSessionCsv } from "@/lib/csv";
import { downloadLetterboxdCsv, letterboxdRowCount } from "@/lib/letterboxd";
import { PALETTES } from "@/lib/theme";
import { usePalette } from "@/components/theme-provider";
import type { CatalogTitle, DiscardEntry, SessionResponse, WatchTag } from "@/lib/types";
import { Settings } from "lucide-react";
import { useState } from "react";

type AppSettingsMenuProps = {
  responses: SessionResponse[];
  discards: DiscardEntry[];
  watchTags: WatchTag[];
  resultCount: number;
  onResetAll: () => void;
  movieResponses: SessionResponse[];
  movieWatchTags: WatchTag[];
  movieQueue: CatalogTitle[];
  catalogTitles: CatalogTitle[];
};

export function AppSettingsMenu({
  responses,
  discards,
  watchTags,
  resultCount,
  onResetAll,
  movieResponses,
  movieWatchTags,
  movieQueue,
  catalogTitles,
}: AppSettingsMenuProps) {
  const { palette, choose } = usePalette();
  const [clearOpen, setClearOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const hasAnything = responses.length + discards.length + watchTags.length > 0;
  const letterboxdInput = {
    responses: movieResponses,
    watchTags: movieWatchTags,
    userQueue: movieQueue,
    customTitles: catalogTitles,
    liveTitles: catalogTitles,
  };
  const hasLetterboxd = letterboxdRowCount(letterboxdInput) > 0;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="outline"
              size="icon-lg"
              aria-label="Open settings"
              className="relative"
            />
          }
        >
          <Settings />
          {resultCount > 0 ? (
            <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
              {resultCount}
            </span>
          ) : null}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="bottom" className="w-56 min-w-56" sideOffset={8}>
          <DropdownMenuItem
            onClick={() => {
              window.setTimeout(() => setPaletteOpen(true), 0);
            }}
          >
            Color Palette
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={!hasAnything} onClick={() => window.print()}>
            Export to PDF
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!hasAnything}
            onClick={() => downloadSessionCsv(responses, discards, watchTags)}
          >
            Export to CSV
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!hasLetterboxd}
            onClick={() => downloadLetterboxdCsv(letterboxdInput)}
          >
            Letterboxd CSV
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setClearOpen(true)}>
            Clear Session
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={paletteOpen} onOpenChange={setPaletteOpen}>
        <DialogContent className="sm:max-w-sm" showCloseButton>
          <DialogHeader>
            <DialogTitle>Color Palette</DialogTitle>
            <DialogDescription>Applies across RandoRanx and is remembered on this device.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            {PALETTES.map((item) => {
              const selected = palette === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    choose(item.id);
                    setPaletteOpen(false);
                  }}
                  className="flex items-center gap-3 rounded-lg border border-border/70 px-3 py-2.5 text-left ring-offset-background hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring"
                  aria-pressed={selected}
                >
                  <span className="flex overflow-hidden rounded-md ring-1 ring-white/15">
                    {item.swatches.map((color) => (
                      <span
                        key={color}
                        className="h-8 w-6"
                        style={{ backgroundColor: color }}
                        aria-hidden
                      />
                    ))}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{item.label}</span>
                    <span className="block text-xs text-muted-foreground">{item.note}</span>
                  </span>
                  {selected ? (
                    <span className="text-xs font-medium text-primary">Selected</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Session?</AlertDialogTitle>
            <AlertDialogDescription>
              This clears your results log, Discard pile, Watch tags, Queue, remembered Tourney skip,
              path filters, and searched titles across Movies, Games, and Music. The built-in catalog
              stays. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep my progress</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onResetAll();
                setClearOpen(false);
              }}
            >
              Clear Session
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
