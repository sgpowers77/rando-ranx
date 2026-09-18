"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { filtersForPreset, GAME_PRESETS, TOURNEY_PRESETS } from "@/lib/presets";
import type { Medium, PathFilters } from "@/lib/types";
import { SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";

type ExperienceModalProps = {
  open: boolean;
  medium: Medium;
  fullRando: boolean;
  onOpenChange: (open: boolean) => void;
  onOpenFilters: () => void;
  onApplyFilters: (filters: PathFilters) => void;
  onFullRandoChange: (on: boolean) => void;
  onContinue: (hideNextTime: boolean) => void;
};

export function ExperienceModal({
  open,
  medium,
  fullRando,
  onOpenChange,
  onOpenFilters,
  onApplyFilters,
  onFullRandoChange,
  onContinue,
}: ExperienceModalProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hideNextTime, setHideNextTime] = useState(false);

  useEffect(() => {
    if (!open) return;
    setSelectedId(null);
    setHideNextTime(false);
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"
        showCloseButton
      >
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">Choose an Experience</DialogTitle>
          <DialogDescription>Choose a Preset Filter Combo or Customize filters</DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" className="gap-2" onClick={onOpenFilters}>
            <SlidersHorizontal className="size-4" />
            Filters
          </Button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {(medium === "game" ? GAME_PRESETS : TOURNEY_PRESETS).map((preset) => {
            const selected = !fullRando && selectedId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                aria-pressed={selected}
                aria-disabled={fullRando}
                disabled={fullRando}
                onClick={() => {
                  if (fullRando) return;
                  setSelectedId(preset.id);
                  onApplyFilters(filtersForPreset(preset.id, medium));
                }}
                className={`rounded-xl border px-3 py-3 text-left transition-colors ${
                  fullRando
                    ? "cursor-not-allowed border-border/40 bg-muted/30 text-muted-foreground opacity-50"
                    : selected
                      ? "border-primary bg-primary/10 ring-1 ring-primary/40"
                      : "border-border/70 bg-card/60 hover:bg-muted/60"
                }`}
              >
                <p className="font-medium leading-snug">{preset.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{preset.blurb}</p>
              </button>
            );
          })}
        </div>

        <DialogFooter className="flex-col gap-3 sm:items-end">
          <label className="flex items-center gap-2 text-sm">
            <Switch
              nativeButton
              checked={hideNextTime}
              onCheckedChange={(checked) => setHideNextTime(Boolean(checked))}
              aria-label="Do not show again"
            />
            Do not show again
          </label>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center sm:justify-end">
            <label className="flex items-center gap-2 text-sm">
              <Switch
                nativeButton
                checked={fullRando}
                onCheckedChange={(checked) => {
                  const on = Boolean(checked);
                  if (on) setSelectedId(null);
                  onFullRandoChange(on);
                }}
                aria-label="Full Rando"
              />
              Full Rando
            </label>
            <div className="flex flex-col-reverse gap-2 sm:flex-row">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Back
              </Button>
              <Button type="button" onClick={() => onContinue(hideNextTime)}>
                Continue
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
