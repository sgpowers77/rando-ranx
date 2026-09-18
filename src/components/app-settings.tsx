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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { downloadSessionCsv } from "@/lib/csv";
import { PALETTES, type PaletteId } from "@/lib/theme";
import { usePalette } from "@/components/theme-provider";
import type { DiscardEntry, SessionResponse, WatchTag } from "@/lib/types";
import { Settings } from "lucide-react";
import { useState } from "react";

type AppSettingsMenuProps = {
  responses: SessionResponse[];
  discards: DiscardEntry[];
  watchTags: WatchTag[];
  resultCount: number;
  onResetAll: () => void;
};

export function AppSettingsMenu({
  responses,
  discards,
  watchTags,
  resultCount,
  onResetAll,
}: AppSettingsMenuProps) {
  const { palette, choose } = usePalette();
  const [clearOpen, setClearOpen] = useState(false);
  const hasAnything = responses.length + discards.length + watchTags.length > 0;

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
          <DropdownMenuGroup>
            <DropdownMenuLabel>Color palette</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={palette}
              onValueChange={(value) => {
                if (value) choose(value as PaletteId);
              }}
            >
              {PALETTES.map((item) => (
                <DropdownMenuRadioItem key={item.id} value={item.id}>
                  {item.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={!hasAnything}
            onClick={() => window.print()}
          >
            Export to PDF
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!hasAnything}
            onClick={() => downloadSessionCsv(responses, discards, watchTags)}
          >
            Export to CSV
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onClick={() => setClearOpen(true)}>
            Clear Session
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Session?</AlertDialogTitle>
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
