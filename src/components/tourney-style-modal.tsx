"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { TourneyStyle } from "@/lib/types";
import { Swords, ThumbsUp } from "lucide-react";

type TourneyStyleModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChoose: (style: TourneyStyle) => void;
};

export function TourneyStyleModal({ open, onOpenChange, onChoose }: TourneyStyleModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <DialogHeader>
          <DialogTitle className="font-heading text-2xl">VS Mode or Like Mode</DialogTitle>
          <DialogDescription>
            How this Tourney deals cards. You can pick again the next time you start Tourney.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button
            type="button"
            className="h-auto min-h-24 flex-col items-start gap-2 whitespace-normal px-4 py-4 text-left"
            onClick={() => onChoose("vs")}
          >
            <span className="flex items-center gap-2 text-base font-medium">
              <Swords className="size-5 shrink-0" />
              VS Mode
            </span>
            <span className="text-xs font-normal text-primary-foreground/80">
              Two cards. Select a Contender. The other title goes to Discard.
            </span>
          </Button>
          <Button
            type="button"
            variant="outline"
            className="h-auto min-h-24 flex-col items-start gap-2 whitespace-normal px-4 py-4 text-left"
            onClick={() => onChoose("like")}
          >
            <span className="flex items-center gap-2 text-base font-medium">
              <ThumbsUp className="size-5 shrink-0" />
              Like Mode
            </span>
            <span className="text-xs font-normal text-muted-foreground">
              Thumb up logs a Contender. Thumb down discards that card. Skip still refills without
              shrinking the stack.
            </span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
