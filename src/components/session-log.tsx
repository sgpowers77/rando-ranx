"use client";

import { resultLabel } from "@/components/results-log";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SessionResponse } from "@/lib/types";

type SessionLogProps = {
  responses: SessionResponse[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function SessionLog({ responses, selectedId, onSelect }: SessionLogProps) {
  const newestFirst = [...responses].reverse();

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="border-b px-4 py-3">
        <p className="font-heading text-sm font-medium">Session log</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {responses.length === 0
            ? "Answers show up here. Select one later to change it."
            : `${responses.length} ${responses.length === 1 ? "entry" : "entries"} · tap to re-edit`}
        </p>
      </div>
      <ul className="min-h-0 flex-1 overflow-auto p-2" aria-label="Session responses">
        {newestFirst.length === 0 ? (
          <li className="px-3 py-8 text-sm text-muted-foreground">
            Deal a movie or game to start filling this list. Rated titles, skips, and the want list
            all stay here.
          </li>
        ) : (
          newestFirst.map((entry) => {
            const selected = entry.id === selectedId;
            return (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => onSelect(entry.id)}
                  aria-current={selected ? "true" : undefined}
                  className={cn(
                    "w-full rounded-lg px-3 py-2.5 text-left transition-colors",
                    selected ? "bg-primary/15 ring-1 ring-primary/40" : "hover:bg-muted/70"
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium leading-snug">{entry.title}</p>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {entry.year}
                    </span>
                  </div>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className="font-normal">
                      {resultLabel(entry)}
                    </Badge>
                    {entry.kind === "rated" && entry.rating != null ? (
                      <span className="text-xs tabular-nums text-muted-foreground">
                        {entry.rating}/10
                      </span>
                    ) : null}
                  </div>
                  {entry.comments ? (
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{entry.comments}</p>
                  ) : null}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
