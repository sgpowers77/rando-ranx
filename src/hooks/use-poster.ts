"use client";

import { fetchPoster, type PosterInfo, type PosterSubject } from "@/lib/poster";
import { useEffect, useState } from "react";

export function usePoster(subject: PosterSubject | null) {
  const [poster, setPoster] = useState<PosterInfo | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "missing">(subject ? "loading" : "missing");

  useEffect(() => {
    if (!subject) {
      setPoster(null);
      setStatus("missing");
      return;
    }
    const controller = new AbortController();
    setPoster(null);
    setStatus("loading");
    fetchPoster(subject, controller.signal)
      .then((info) => {
        if (controller.signal.aborted) return;
        setPoster(info);
        setStatus(info ? "ready" : "missing");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setPoster(null);
        setStatus("missing");
      });
    return () => controller.abort();
  }, [subject?.id, subject?.title, subject?.year, subject?.medium, subject?.imdbId]);

  return { poster, status };
}
