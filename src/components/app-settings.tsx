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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { downloadSessionCsv } from "@/lib/csv";
import { PALETTES } from "@/lib/theme";
import { usePalette } from "@/components/theme-provider";
import type { DiscardEntry, SessionResponse, WatchTag } from "@/lib/types";
import { Download, Printer, RotateCcw } from "lucide-react";
import { useState } from "react";

type AppSettingsSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  responses: SessionResponse[];
  discards: DiscardEntry[];
  watchTags: WatchTag[];
  onResetAll: () => void;
  onViewTable: () => void;
};

export function AppSettingsSheet({
  open,
  onOpenChange,
  responses,
  discards,
  watchTags,
  onResetAll,
  onViewTable,
}: AppSettingsSheetProps) {
  const { palette, choose } = usePalette();
  const [resetOpen, setResetOpen] = useState(false);
  const hasAnything = responses.length + discards.length + watchTags.length > 0;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="flex h-dvh max-h-dvh w-full flex-col gap-0 sm:max-w-md" showCloseButton>
          <SheetHeader className="shrink-0 border-b">
            <SheetTitle>Settings</SheetTitle>
            <SheetDescription>Progress, export, and color palettes for this device.</SheetDescription>
          </SheetHeader>
          <div className="min-h-0 flex-1 space-y-8 overflow-auto px-4 py-5">
            <section className="space-y-3">
              <h2 className="text-sm font-medium">Progress</h2>
              <Button
                type="button"
                variant="outline"
                className="h-11 w-full justify-start gap-2"
                onClick={() => setResetOpen(true)}
              >
                <RotateCcw className="size-4" />
                Reset progress
              </Button>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-medium">Export</h2>
              <p className="text-xs text-muted-foreground">
                Print or download the session table (results, discards, and Watch).
              </p>
              <div className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full justify-start gap-2"
                  onClick={() => {
                    onOpenChange(false);
                    onViewTable();
                  }}
                >
                  View printable table
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 w-full justify-start gap-2"
                  disabled={!hasAnything}
                  onClick={() => downloadSessionCsv(responses, discards, watchTags)}
                >
                  <Download className="size-4" />
                  Download CSV
                </Button>
                <Button
                  type="button"
                  className="h-11 w-full justify-start gap-2"
                  onClick={() => window.print()}
                >
                  <Printer className="size-4" />
                  Print table
                </Button>
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-sm font-medium">Color palette</h2>
              <p className="text-xs text-muted-foreground">
                Applies across RandoRanx and is remembered in this browser.
              </p>
              <div className="grid gap-2">
                {PALETTES.map((item) => {
                  const selected = palette === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => choose(item.id)}
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
            </section>
          </div>
        </SheetContent>
      </Sheet>

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
                onOpenChange(false);
              }}
            >
              Reset all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
