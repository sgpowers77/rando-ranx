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
import { fetchWikipediaBlurbClient } from "@/lib/wiki-client";
import type { CatalogTitle } from "@/lib/types";
import { useEffect, useState } from "react";

type WtfModalProps = {
  title: CatalogTitle | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWatchlist: (title: CatalogTitle) => void;
};

type Blurb = {
  extract: string;
  sourceUrl: string;
  source: string;
};

export function WtfModal({ title, open, onOpenChange, onWatchlist }: WtfModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        {title ? (
          <WtfBody
            key={title.id}
            title={title}
            onContinue={() => onOpenChange(false)}
            onWatchlist={() => {
              onWatchlist(title);
              onOpenChange(false);
            }}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function WtfBody({
  title,
  onContinue,
  onWatchlist,
}: {
  title: CatalogTitle;
  onContinue: () => void;
  onWatchlist: () => void;
}) {
  const [blurb, setBlurb] = useState<Blurb | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetchWikipediaBlurbClient(title.title, String(title.year), title.medium, title.imdbId, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setBlurb(data);
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setFailed(true);
      });
    return () => controller.abort();
  }, [title]);

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {title.title} ({title.year})
        </DialogTitle>
        <DialogDescription>
          A short Wikipedia summary. This does not pick a winner or discard the card.
        </DialogDescription>
      </DialogHeader>
      {!blurb && !failed ? <p className="text-sm text-muted-foreground">Looking it up…</p> : null}
      {failed ? (
        <p className="text-sm text-destructive" role="alert">
          Could not load a description. Continue the matchup, or try WTF?? again.
        </p>
      ) : null}
      {blurb ? (
        <div className="space-y-3 text-sm">
          <p className="leading-relaxed">{blurb.extract}</p>
          {blurb.sourceUrl ? (
            <a
              href={blurb.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline underline-offset-4"
            >
              Source: Wikipedia
            </a>
          ) : null}
        </div>
      ) : null}
      <DialogFooter className="gap-2 sm:justify-end">
        <Button type="button" variant="outline" onClick={onContinue}>
          Continue
        </Button>
        <Button type="button" onClick={onWatchlist}>
          Watchlist
        </Button>
      </DialogFooter>
    </>
  );
}
