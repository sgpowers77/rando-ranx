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
import type { SessionResponse } from "@/lib/types";
import { Printer } from "lucide-react";

type ResultsLogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  responses: SessionResponse[];
  onClear: () => void;
};

export function resultLabel(entry: SessionResponse): string {
  if (entry.kind === "rated") {
    return entry.medium === "movie" ? "Seen it" : "Played it";
  }
  if (entry.kind === "queued") {
    return entry.medium === "movie" ? "Want to see it" : "Want to play it";
  }
  return entry.medium === "movie" ? "Haven't seen it" : "Haven't played it";
}

export function ResultsTable({
  responses,
  id,
  caption,
}: {
  responses: SessionResponse[];
  id?: string;
  caption?: string;
}) {
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
        </TableRow>
      </TableHeader>
      <TableBody>
        {responses.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="py-8 text-muted-foreground">
              No answers yet. Pick Movies or Games and start ranking.
            </TableCell>
          </TableRow>
        ) : (
          responses.map((entry) => (
            <TableRow key={entry.id}>
              <TableCell className="font-medium">{entry.title}</TableCell>
              <TableCell>{entry.year}</TableCell>
              <TableCell>{entry.medium === "movie" ? "Movies" : "Games"}</TableCell>
              <TableCell>{resultLabel(entry)}</TableCell>
              <TableCell>{entry.kind === "rated" ? entry.rating : "—"}</TableCell>
              <TableCell className="max-w-xs whitespace-pre-wrap">
                {entry.comments?.trim() ? entry.comments : "—"}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}

export function ResultsLog({ open, onOpenChange, responses, onClear }: ResultsLogProps) {
  const rated = responses.filter((entry) => entry.kind === "rated").length;
  const skipped = responses.filter((entry) => entry.kind === "skipped").length;
  const queued = responses.filter((entry) => entry.kind === "queued").length;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 sm:max-w-3xl"
        showCloseButton
      >
        <SheetHeader className="border-b">
          <SheetTitle>Results log</SheetTitle>
          <SheetDescription>
            {responses.length === 0
              ? "This table fills as you rank, skip, or queue titles. Print it whenever you want a paper copy."
              : `${rated} rated · ${skipped} skipped · ${queued} on the want list`}
          </SheetDescription>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-auto px-4 py-4">
          <ResultsTable responses={responses} />
        </div>
        <SheetFooter className="border-t sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="ghost"
            onClick={onClear}
            disabled={responses.length === 0}
          >
            Clear session
          </Button>
          <Button
            type="button"
            onClick={() => window.print()}
            className="gap-2"
          >
            <Printer className="size-4" />
            Print table
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
