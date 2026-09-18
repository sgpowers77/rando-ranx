"use client";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { SlidersHorizontal } from "lucide-react";

type FilterToolbarProps = {
  randomizeOn: boolean;
  onOpenFilters: () => void;
  onRandomizeChange: (on: boolean) => void;
  filtersVariant?: "ghost" | "outline";
};

export function FilterToolbar({
  randomizeOn,
  onOpenFilters,
  onRandomizeChange,
  filtersVariant = "ghost",
}: FilterToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-1">
      <Button
        type="button"
        variant={filtersVariant}
        size={filtersVariant === "outline" ? "default" : "sm"}
        className={filtersVariant === "outline" ? "gap-2" : "gap-1.5"}
        aria-label="Filters"
        onClick={onOpenFilters}
      >
        <SlidersHorizontal className="size-4" />
        Filters
      </Button>
      <div className="flex h-8 items-center gap-2 rounded-lg px-2.5 text-sm">
        <Switch
          checked={randomizeOn}
          nativeButton
          onCheckedChange={(checked) => onRandomizeChange(Boolean(checked))}
          aria-label="Randomize filters"
        />
        <span className="select-none">Randomize</span>
      </div>
    </div>
  );
}
