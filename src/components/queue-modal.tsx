"use client";

import { TitlePoster } from "@/components/title-poster";
import { TitleSearch } from "@/components/title-search";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { CatalogTitle, Medium } from "@/lib/types";
import { X } from "lucide-react";

type QueueModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  medium: Medium | null;
  titles: CatalogTitle[];
  queueOnly: boolean;
  onQueue: (titles: CatalogTitle[]) => void;
  onRemove: (titleId: string) => void;
  onQueueOnlyChange: (queueOnly: boolean) => void;
};

export function QueueModal({
  open,
  onOpenChange,
  medium,
  titles,
  queueOnly,
  onQueue,
  onRemove,
  onQueueOnlyChange,
}: QueueModalProps) {
  const noun = medium === "game" ? "games" : "movies";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden sm:max-w-lg" showCloseButton>
        <DialogHeader className="shrink-0">
          <DialogTitle>Queue</DialogTitle>
          <DialogDescription>
            Titles you queued from Wikipedia search for the current catalog. Queue is never filled by
            random deals.
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-auto px-1 py-3">
          {!medium ? (
            <p className="text-sm text-muted-foreground">Choose Movies or Games to see that catalog’s queue.</p>
          ) : titles.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No queued {noun} yet. Search below and tap Queue.
            </p>
          ) : (
            <ul className="space-y-2">
              {titles.map((item) => (
                <li
                  key={item.id}
                  className="flex items-start gap-3 rounded-lg bg-muted/40 px-3 py-2 ring-1 ring-white/10"
                >
                  <TitlePoster catalog={item} size="sm" showCredit />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-snug">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.year}</p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Remove ${item.title} from queue`}
                    onClick={() => onRemove(item.id)}
                  >
                    <X className="size-4" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
          <label className="flex items-start gap-3 rounded-lg border border-border/70 px-3 py-3 text-sm">
            <Checkbox
              checked={queueOnly}
              onCheckedChange={(value) => onQueueOnlyChange(value === true)}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">Only present user-queued items</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Off by default. When on, Ranx and Tourney deal only from this queue — no random catalog
                titles.
              </span>
            </span>
          </label>
          {medium ? (
            <TitleSearch
              medium={medium}
              queuedIds={titles.map((item) => item.id)}
              onQueue={onQueue}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
