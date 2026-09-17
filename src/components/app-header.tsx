"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

type AppHeaderProps = {
  onHome: () => void;
  onOpenLog: () => void;
  resultCount: number;
  showHome: boolean;
};

export function AppHeader({ onHome, onOpenLog, resultCount, showHome }: AppHeaderProps) {
  return (
    <header className="no-print sticky top-0 z-40 flex items-center justify-between gap-3 border-b border-border/70 bg-background/90 px-4 py-3 backdrop-blur-md sm:px-6">
      <button
        type="button"
        onClick={onHome}
        className="text-left"
        aria-label={showHome ? "Back to Movies or Games" : "RandoRanx home"}
      >
        <p className="font-heading text-lg tracking-tight">RandoRanx</p>
        <p className="text-xs text-muted-foreground">Shuffle a title. Rank it honestly.</p>
      </button>
      <Button
        type="button"
        variant="outline"
        size="icon-lg"
        aria-label={`Open printable results log, ${resultCount} ${resultCount === 1 ? "entry" : "entries"}`}
        onClick={onOpenLog}
        className="relative"
      >
        <Printer />
        {resultCount > 0 ? (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
            {resultCount}
          </span>
        ) : null}
      </Button>
    </header>
  );
}
