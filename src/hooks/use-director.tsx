"use client";

import { lookupDirector } from "@/lib/director";
import type { CatalogTitle } from "@/lib/types";
import { useEffect, useState } from "react";

export function useDirector(title: CatalogTitle | null): string | null {
  const seeded = title?.director?.trim() || null;
  const [director, setDirector] = useState<string | null>(seeded);

  useEffect(() => {
    if (!title || title.medium !== "movie") {
      setDirector(null);
      return;
    }
    if (title.director?.trim()) {
      setDirector(title.director.trim());
      return;
    }
    setDirector(null);
    const controller = new AbortController();
    void lookupDirector(title, controller.signal).then((name) => {
      if (!controller.signal.aborted) setDirector(name);
    });
    return () => controller.abort();
  }, [title?.id, title?.title, title?.year, title?.imdbId, title?.medium, title?.director]);

  return director;
}

export function TitleDirector({
  title,
  className = "line-clamp-1 h-5 text-sm text-muted-foreground",
}: {
  title: CatalogTitle;
  className?: string;
}) {
  const director = useDirector(title);
  if (title.medium !== "movie") return null;
  return <p className={className}>{director ?? "\u00a0"}</p>;
}
