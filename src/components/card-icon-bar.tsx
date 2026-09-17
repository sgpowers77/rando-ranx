"use client";

import { Button } from "@/components/ui/button";
import { Bookmark, Star } from "lucide-react";

export function CardIconBar({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-card-chrome
      className="absolute top-2 right-2 z-10 flex items-center gap-0.5"
    >
      {children}
    </div>
  );
}

export function StarIconButton({
  active,
  label,
  onClick,
}: {
  active?: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      aria-pressed={active}
      draggable={false}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      <Star className={`size-4 ${active ? "fill-amber-300 text-amber-300" : ""}`} />
    </Button>
  );
}

export function BookmarkIconButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      aria-label={label}
      aria-pressed={active}
      draggable={false}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      <Bookmark className={`size-4 ${active ? "fill-current" : ""}`} />
    </Button>
  );
}
