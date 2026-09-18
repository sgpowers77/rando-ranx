"use client";

import { Button } from "@/components/ui/button";
import { Bookmark, Star } from "lucide-react";

export function CardIconBar({
  children,
  placement = "overlay",
}: {
  children: React.ReactNode;
  placement?: "overlay" | "inline";
}) {
  return (
    <div
      data-card-chrome
      className={
        placement === "inline"
          ? "relative z-10 ml-auto flex shrink-0 items-center gap-0.5 rounded-lg bg-background/90 p-0.5 ring-1 ring-white/15"
          : "absolute top-2 right-2 z-10 flex items-center gap-0.5 rounded-lg bg-background/90 p-0.5 ring-1 ring-white/15"
      }
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
      title="Rate"
      aria-pressed={active}
      draggable={false}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
    >
      <Star className={`size-4 ${active ? "fill-primary text-primary" : ""}`} />
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
      variant="outline"
      size="icon-sm"
      aria-label={label}
      title="Watch"
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
