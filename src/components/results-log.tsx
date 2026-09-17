"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { DiscardEntry, SessionResponse, WatchTag } from "@/lib/types";
import { downloadSessionCsv } from "@/lib/csv";
import { resultLabel } from "@/lib/labels";
import { Download, Printer } from "lucide-react";

type ResultsLogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  responses: SessionResponse[];
  discards: DiscardEntry[];
  watchTags: WatchTag[];
  onClear: () => void;
};

export { resultLabel } from "@/lib/labels";

export function ResultsTable({
  responses,
  discards = [],
  watchTags = [],
  id,
  caption,
}: {
  responses: SessionResponse[];
  discards?: DiscardEntry[];
  watchTags?: WatchTag[];
  id?: string;
  caption?: string;
}) {
  const watchIds = new Set(watchTags.map((tag) => tag.titleId));
  const loggedIds = new Set([
    ...responses.map((entry) => entry.titleId),
    ...discards.map((entry) => entry.titleId),
  ]);
  const watchOnly = watchTags.filter((tag) => !loggedIds.has(tag.titleId));
  const empty = responses.length === 0 && discards.length === 0 && watchTags.length === 0;
  return (
    <Table id={id} className="print:text-black">
      {caption ? <caption className="mb-3 text-left text-base font-medium">{caption}</caption> : null}
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Year</TableHead>
          <TableHead>Catalog</TableHead>
          <TableHead>Result</TableHead>
          <TableHead>Rating</TableHead>
          <TableHead>Comments</TableHead>
          <TableHead>Watch</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {empty ? (
          <TableRow>
            <TableCell colSpan={7} className="py-8 text-muted-foreground">
              No answers yet. Pick Movies or Games, then Rank or Tourney.
            </TableCell>
          </TableRow>
        ) : (
          <>
            {responses.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">{entry.title}</TableCell>
                <TableCell>{entry.year}</TableCell>
                <TableCell>{entry.medium === "movie" ? "Movies" : "Games"}</TableCell>
                <TableCell>{resultLabel(entry)}</TableCell>
                <TableCell>{entry.kind === "rated" ? entry.rating : "—"}</TableCell>
                <TableCell className="max-w-xs whitespace-pre-wrap">
                  {entry.comments?.trim() ? entry.comments : "—"}
                </TableCell>
                <TableCell>{watchIds.has(entry.titleId) ? "Watch" : "—"}</TableCell>
              </TableRow>
            ))}
            {discards.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-medium">{entry.title}</TableCell>
                <TableCell>{entry.year}</TableCell>
                <TableCell>{entry.medium === "movie" ? "Movies" : "Games"}</TableCell>
                <TableCell>Discarded vs {entry.lostToTitle}</TableCell>
                <TableCell>—</TableCell>
                <TableCell>—</TableCell>
                <TableCell>{watchIds.has(entry.titleId) ? "Watch" : "—"}</TableCell>
              </TableRow>
            ))}
            {watchOnly.map((tag) => (
              <TableRow key={`watch-${tag.titleId}-${tag.taggedAt}`}>
                <TableCell className="font-medium">{tag.title}</TableCell>
                <TableCell>{tag.year}</TableCell>
                <TableCell>{tag.medium === "movie" ? "Movies" : "Games"}</TableCell>
                <TableCell>Watchlist</TableCell>
                <TableCell>—</TableCell>
                <TableCell>—</TableCell>
                <TableCell>Watch</TableCell>
              </TableRow>
            ))}
          </>
        )}
      </TableBody>
    </Table>
  );
}

export function ResultsLog({
  open,
  onOpenChange,
  responses,
  discards,
  watchTags,
  onClear,
}: ResultsLogProps) {
  const rated = responses.filter((entry) => entry.kind === "rated").length;
  const skipped = responses.filter((entry) => entry.kind === "skipped").length;
  const queued = responses.filter((entry) => entry.kind === "queued").length;
  const hasAnything = responses.length + discards.length + watchTags.length > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 sm:max-w-3xl"
        showCloseButton
      >
        <SheetHeader className="border-b">
          <SheetTitle>Printable table</SheetTitle>
          <SheetDescription>
            {!hasAnything
              ? "This table fills as you rank, skip, queue, discard, or watchlist titles. Print it or download CSV whenever you want a copy."
              : `${rated} rated · ${skipped} skipped · ${queued} on the want list · ${discards.length} discarded · ${watchTags.length} watchlisted`}
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
          <ResultsTable responses={responses} discards={discards} watchTags={watchTags} />
        </div>
        <SheetFooter className="border-t sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={onClear}
            disabled={!hasAnything}
          >
            Clear session
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              disabled={!hasAnything}
              onClick={() => downloadSessionCsv(responses, discards, watchTags)}
            >
              <Download className="size-4" />
              Download CSV
            </Button>
            <Button
              type="button"
              onClick={() => window.print()}
              className="gap-2"
            >
              <Printer className="size-4" />
              Print table
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
