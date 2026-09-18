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
import { filtersForPreset, groupedPresets } from "@/lib/presets";
import type { Medium, PathFilters } from "@/lib/types";
import { ChevronDown, SlidersHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

const FULL_RANDO_LABEL = "Full Rando (May Result in Hilariously Inappropriate Juxtapositions)";

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
  const groups = useMemo(() => groupedPresets(medium), [medium]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hideNextTime, setHideNextTime] = useState(false);
  const [openGroupIds, setOpenGroupIds] = useState<string[]>(() =>
    groups[0] ? [groups[0].group.id] : []
  );

  useEffect(() => {
    if (!open) return;
    setSelectedId(null);
    setHideNextTime(false);
    setOpenGroupIds(groups[0] ? [groups[0].group.id] : []);
  }, [open, medium, groups]);

  const toggleGroup = (id: string) => {
    setOpenGroupIds((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

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

        <div className="space-y-2">
          {groups.map(({ group, presets }) => {
            const expanded = openGroupIds.includes(group.id);
            return (
              <section
                key={group.id}
                className="overflow-hidden rounded-xl border border-border/70 bg-card/40"
              >
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => toggleGroup(group.id)}
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/40"
                >
                  <ChevronDown
                    className={`size-4 shrink-0 text-muted-foreground transition-transform ${
                      expanded ? "rotate-0" : "-rotate-90"
                    }`}
                  />
                  <span className="min-w-0 flex-1 font-heading text-base font-medium leading-snug">
                    {group.title}
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{presets.length}</span>
                </button>
                {expanded ? (
                  <div className="grid gap-2 border-t border-border/60 p-2 sm:grid-cols-2">
                    {presets.map((preset) => {
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
                ) : null}
              </section>
            );
          })}
        </div>

        <DialogFooter className="flex-col gap-3 sm:items-stretch">
          <label className="flex items-center gap-2 text-sm">
            <Switch
              nativeButton
              checked={hideNextTime}
              onCheckedChange={(checked) => setHideNextTime(Boolean(checked))}
              aria-label="Do not show again"
            />
            Do not show again
          </label>
          <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <label className="flex max-w-md items-start gap-2 text-sm leading-snug">
              <Switch
                nativeButton
                className="mt-0.5"
                checked={fullRando}
                onCheckedChange={(checked) => {
                  const on = Boolean(checked);
                  if (on) setSelectedId(null);
                  onFullRandoChange(on);
                }}
                aria-label={FULL_RANDO_LABEL}
              />
              {FULL_RANDO_LABEL}
            </label>
            <div className="flex shrink-0 flex-col-reverse gap-2 sm:flex-row">
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
