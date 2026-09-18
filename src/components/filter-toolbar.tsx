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
      <label className="flex h-8 cursor-pointer items-center gap-2 rounded-lg px-2.5 text-sm hover:bg-muted">
        <Switch
          checked={randomizeOn}
          onCheckedChange={(checked) => onRandomizeChange(checked === true)}
          aria-label="Randomize filters"
        />
        Randomize
      </label>
    </div>
  );
}
