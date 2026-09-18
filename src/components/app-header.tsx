"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Info, List } from "lucide-react";
import type { ReactNode } from "react";

type AppHeaderProps = {
  onHome: () => void;
  settings: ReactNode;
  onOpenMobileLog: () => void;
  onOpenTourneyHelp?: () => void;
  resultCount: number;
  showHome: boolean;
  showTourneyHelp?: boolean;
};

export function AppHeader({
  onHome,
  settings,
  onOpenMobileLog,
  onOpenTourneyHelp,
  resultCount,
  showHome,
  showTourneyHelp = false,
}: AppHeaderProps) {
  return (
    <header className="no-print sticky top-0 z-40 flex shrink-0 items-center justify-between gap-3 border-b border-border/70 bg-background/90 px-4 py-3 backdrop-blur-md sm:px-6">
      <div className="flex min-w-0 items-center gap-2">
        {showHome ? (
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="lg:hidden"
            aria-label="Back to home"
            onClick={onHome}
          >
            <ArrowLeft />
          </Button>
        ) : null}
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="lg:hidden"
          aria-label={`Open session log, ${resultCount} ${resultCount === 1 ? "entry" : "entries"}`}
          onClick={onOpenMobileLog}
        >
          <List />
        </Button>
        <button
          type="button"
          onClick={onHome}
          className="text-left"
          aria-label={showHome ? "Back to Movies or Games" : "RandoRanx home"}
        >
          <p className="font-heading text-lg tracking-tight">RandoRanx</p>
          <p className="text-xs text-muted-foreground">It&apos;s Showdown Time</p>
        </button>
      </div>
      <div className="flex items-center gap-2">
        {showTourneyHelp && onOpenTourneyHelp ? (
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            className="lg:hidden"
            aria-label="Tourney instructions"
            onClick={onOpenTourneyHelp}
          >
            <Info />
          </Button>
        ) : null}
        {settings}
      </div>
    </header>
  );
}
