"use client";

import { TitlePoster } from "@/components/title-poster";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { catalogLabel } from "@/lib/medium";
import { resultLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { DiscardEntry, Medium, PlayMode, SessionResponse, WatchTag } from "@/lib/types";
import { ListPlus } from "lucide-react";

type SessionLogProps = {
  responses: SessionResponse[];
  discards: DiscardEntry[];
  watchTags: WatchTag[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onFinalRound?: () => void;
  canFinalRound?: boolean;
  finalRoundActive?: boolean;
  contenderCount?: number;
  hideDiscard?: boolean;
  playMode?: PlayMode | null;
  medium?: Medium | null;
  queueCount?: number;
  onOpenQueue?: () => void;
};

export function SessionLog({
  responses,
  discards,
  watchTags = [],
  selectedId,
  onSelect,
  onFinalRound,
  canFinalRound = false,
  finalRoundActive = false,
  contenderCount = 0,
  hideDiscard = false,
  playMode = null,
  medium = null,
  queueCount = 0,
  onOpenQueue,
}: SessionLogProps) {
  const newestResults = [...responses].reverse();
  const newestDiscards = [...discards].reverse();
  const newestWatch = [...watchTags].reverse();
  const watchIds = new Set(watchTags.map((tag) => tag.titleId));

  return (
    <Tabs key={hideDiscard ? "ranx" : "all"} defaultValue="results" className="flex h-full min-h-0 flex-col gap-0 overflow-hidden">
      <div className="shrink-0 border-b px-3 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="font-heading text-sm font-medium">
            {medium ? `${catalogLabel(medium)} log` : "Session log"}
          </p>
          {queueCount > 0 && onOpenQueue ? (
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              aria-label={`Open queue, ${queueCount} ${queueCount === 1 ? "title" : "titles"}`}
              onClick={onOpenQueue}
            >
              <ListPlus className="size-4" />
            </Button>
          ) : null}
        </div>
        <TabsList className={`mt-3 grid h-9 w-full ${hideDiscard ? "grid-cols-2" : "grid-cols-3"}`}>
          <TabsTrigger value="results">Results ({responses.length})</TabsTrigger>
          {hideDiscard ? null : <TabsTrigger value="discard">Discard ({discards.length})</TabsTrigger>}
          <TabsTrigger value="watch">Watch ({watchTags.length})</TabsTrigger>
        </TabsList>
      </div>

      <TabsContent value="results" className="min-h-0 flex-1 overflow-y-auto p-2">
        <div className="mb-2 px-1">
          <Button
            type="button"
            variant="outline"
            className="h-10 w-full"
            disabled={!canFinalRound || !onFinalRound}
            onClick={onFinalRound}
          >
            {finalRoundActive ? "Restart Final Round" : "Final Round"}
          </Button>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {canFinalRound
              ? `Vote among ${contenderCount} logged Contenders until a champion.`
              : "Log at least two Tourney Contenders, then start a Final Round."}
          </p>
        </div>
        <ul aria-label="Session results">
          {newestResults.length === 0 ? (
            <li className="px-3 py-8 text-sm text-muted-foreground">
              {!medium
                ? "Choose Movies, Games, or Music to see that catalog’s Results. Each catalog keeps its own log."
                : playMode === "rank"
                ? "Rated titles, skips, and the want list land here. Titles already in Results will not be dealt again in Ranx."
                : "Ranx titles, skips, and the want list land here. Tourney Contenders show up after you pick them."}
            </li>
          ) : (
            newestResults.map((entry) => {
              const selected = entry.id === selectedId;
              return (
                <li key={entry.id} className="flex items-start gap-2 rounded-lg px-3 py-2.5">
                  <TitlePoster
                    id={entry.titleId}
                    title={entry.title}
                    year={entry.year}
                    medium={entry.medium}
                    size="sm"
                    showCredit
                    className="pt-0.5"
                  />
                  <button
                    type="button"
                    onClick={() => onSelect(entry.id)}
                    aria-current={selected ? "true" : undefined}
                    className={cn(
                      "min-w-0 flex-1 rounded-lg px-1 py-0.5 text-left transition-colors",
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

      {hideDiscard ? null : (
      <TabsContent value="discard" className="min-h-0 flex-1 overflow-y-auto p-2">
        <ul aria-label="Discarded titles">
          {newestDiscards.length === 0 ? (
            <li className="px-3 py-8 text-sm text-muted-foreground">
              {!medium
                ? "Choose Movies, Games, or Music to see that catalog’s discards."
                : "Titles that lose a Tourney matchup appear here. They are not scored."}
            </li>
          ) : (
            newestDiscards.map((entry) => (
              <li key={entry.id} className="rounded-lg px-3 py-2.5">
                <div className="flex items-start gap-2">
                  <TitlePoster
                    id={entry.titleId}
                    title={entry.title}
                    year={entry.year}
                    medium={entry.medium}
                    size="sm"
                    showCredit
                  />
                  <div className="min-w-0 flex-1">
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
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </TabsContent>
      )}

      <TabsContent value="watch" className="min-h-0 flex-1 overflow-y-auto p-2">
        <ul aria-label="Watch tags">
          {newestWatch.length === 0 ? (
            <li className="px-3 py-8 text-sm text-muted-foreground">
              {!medium
                ? "Choose Movies, Games, or Music to see that catalog’s Watch list."
                : "Bookmark a Ranx or Tourney card, or drop it on WTF?? and choose Watchlist."}
            </li>
          ) : (
            newestWatch.map((entry) => (
              <li key={entry.titleId} className="rounded-lg px-3 py-2.5">
                <div className="flex items-start gap-2">
                  <TitlePoster
                    id={entry.titleId}
                    title={entry.title}
                    year={entry.year}
                    medium={entry.medium}
                    size="sm"
                    showCredit
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium leading-snug">{entry.title}</p>
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {entry.year}
                      </span>
                    </div>
                    <div className="mt-1.5">
                      <Badge className="font-normal">Watch</Badge>
                    </div>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </TabsContent>
    </Tabs>
  );
}
