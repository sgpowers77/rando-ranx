"use client";

import { fetchPoster, type PosterInfo, type PosterSubject } from "@/lib/poster";
import { useEffect, useState } from "react";

export function usePoster(subject: PosterSubject | null) {
  const [poster, setPoster] = useState<PosterInfo | null>(
    subject?.imageUrl
      ? {
          url: subject.imageUrl,
          credit: {
            label: subject.imageCreditLabel ?? "Wikipedia",
            href: subject.imageCreditHref ?? subject.imageUrl,
          },
        }
      : null
  );
  const [status, setStatus] = useState<"loading" | "ready" | "missing">(
    subject?.imageUrl ? "ready" : "loading"
  );

  useEffect(() => {
    if (!subject) {
      setPoster(null);
      setStatus("missing");
      return;
    }
    if (subject.imageUrl) {
      setPoster({
        url: subject.imageUrl,
        credit: {
          label: subject.imageCreditLabel ?? "Wikipedia",
          href: subject.imageCreditHref ?? subject.imageUrl,
        },
      });
      setStatus("ready");
      return;
    }
    const controller = new AbortController();
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
  }, [
    subject?.id,
    subject?.title,
    subject?.year,
    subject?.medium,
    subject?.imdbId,
    subject?.imageUrl,
    subject?.imageCreditHref,
    subject?.imageCreditLabel,
  ]);

  return { poster, status };
}
