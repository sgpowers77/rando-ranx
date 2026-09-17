"use client";

import { resultLabel } from "@/components/results-log";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { DiscardEntry, SessionResponse, WatchTag } from "@/lib/types";

type SessionLogProps = {
  responses: SessionResponse[];
  discards: DiscardEntry[];
  watchTags: WatchTag[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function SessionLog({
  responses,
  discards,
  watchTags,
  selectedId,
  onSelect,
}: SessionLogProps) {
  const newestResults = [...responses].reverse();
  const newestDiscards = [...discards].reverse();
  const newestWatch = [...watchTags].reverse();
  const watchIds = new Set(watchTags.map((tag) => tag.titleId));

  return (
    <Tabs defaultValue="results" className="flex h-full min-h-0 flex-col gap-0">
      <div className="border-b px-3 py-3">
        <p className="font-heading text-sm font-medium">Session log</p>
        <TabsList className="mt-3 grid h-9 w-full grid-cols-3">
          <TabsTrigger value="results">Results ({responses.length})</TabsTrigger>
          <TabsTrigger value="discard">Discard ({discards.length})</TabsTrigger>
          <TabsTrigger value="watch">Watch ({watchTags.length})</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="results" className="min-h-0 flex-1 overflow-auto p-2">
        <ul aria-label="Session results">
          {newestResults.length === 0 ? (
            <li className="px-3 py-8 text-sm text-muted-foreground">
              Ranked titles, skips, and the want list land here. Tourney winners show up after you
              score them.
            </li>
          ) : (
            newestResults.map((entry) => {
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
                      {watchIds.has(entry.titleId) ? (
                        <Badge variant="outline" className="font-normal">
                          Watch
                        </Badge>
                      ) : null}
                      {entry.kind === "rated" && entry.rating != null ? (
                        <span className="text-xs tabular-nums text-muted-foreground">
                          {entry.rating}/10
                        </span>
                      ) : null}
                    </div>
                    {entry.comments ? (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                        {entry.comments}
                      </p>
                    ) : null}
                  </button>
                </li>
              );
            })
          )}
        </ul>
      </TabsContent>

      <TabsContent value="discard" className="min-h-0 flex-1 overflow-auto p-2">
        <ul aria-label="Discarded titles">
          {newestDiscards.length === 0 ? (
            <li className="px-3 py-8 text-sm text-muted-foreground">
              Titles that lose a Tourney matchup appear here. They are not scored.
            </li>
          ) : (
            newestDiscards.map((entry) => (
              <li key={entry.id} className="rounded-lg px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium leading-snug">{entry.title}</p>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {entry.year}
                  </span>
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <Badge variant="outline" className="font-normal">
                    Discard
                  </Badge>
                  {watchIds.has(entry.titleId) ? (
                    <Badge variant="outline" className="font-normal">
                      Watch
                    </Badge>
                  ) : null}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Lost to {entry.lostToTitle}</p>
              </li>
            ))
          )}
        </ul>
      </TabsContent>

      <TabsContent value="watch" className="min-h-0 flex-1 overflow-auto p-2">
        <ul aria-label="Watch tags">
          {newestWatch.length === 0 ? (
            <li className="px-3 py-8 text-sm text-muted-foreground">
              Drop a Tourney card on WTF?? and choose Watchlist to tag it here.
            </li>
          ) : (
            newestWatch.map((entry) => (
              <li key={entry.titleId} className="rounded-lg px-3 py-2.5">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium leading-snug">{entry.title}</p>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {entry.year}
                  </span>
                </div>
                <div className="mt-1.5">
                  <Badge className="font-normal">Watch</Badge>
                </div>
              </li>
            ))
          )}
        </ul>
      </TabsContent>
    </Tabs>
  );
}
