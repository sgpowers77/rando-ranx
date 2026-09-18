"use client";

import { usePoster } from "@/hooks/use-poster";
import { imdbUrlFor } from "@/lib/imdb";
import { catalogPosterSubject } from "@/lib/poster";
import type { CatalogTitle, Medium } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

type PosterSize = "lg" | "md" | "sm" | "tourney";

type TitlePosterProps = {
  title?: string;
  year?: number;
  medium?: Medium;
  imdbId?: string;
  id?: string;
  catalog?: CatalogTitle;
  size?: PosterSize;
  className?: string;
  showCredit?: boolean;
};

const frame: Record<PosterSize, string> = {
  lg: "aspect-[2/3] w-full max-w-[18rem] sm:max-w-[20rem]",
  md: "aspect-[2/3] w-full max-w-[16rem] sm:max-w-[18rem]",
  sm: "aspect-[2/3] h-28 w-auto shrink-0",
  tourney:
    "aspect-[2/3] h-40 w-auto max-h-40 lg:h-auto lg:max-h-none lg:w-full lg:max-w-[16rem]",
};

const POSTER_WAIT_MS = 3000;

export function TitlePoster(props: TitlePosterProps) {
  const catalog = props.catalog;
  const subject = catalog
    ? catalogPosterSubject(catalog)
    : props.title && props.year != null && props.medium
      ? {
          id: props.id,
          title: props.title,
          year: props.year,
          medium: props.medium,
          imdbId: props.imdbId,
        }
      : null;
  const { poster, status } = usePoster(subject);
  const [broken, setBroken] = useState(false);
  const [imageReady, setImageReady] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const size = props.size ?? "md";
  const showCredit = props.showCredit ?? size !== "sm";
  const showImage = Boolean(poster) && !broken && imageReady;
  const imdbHref = subject
    ? imdbUrlFor({
        title: subject.title,
        year: subject.year,
        imdbId: subject.imdbId ?? catalog?.imdbId,
      })
    : null;
  const waiting = !showImage && !timedOut && status !== "missing" && !broken;
  const missing = !showImage && (timedOut || status === "missing" || broken);

  useEffect(() => {
    setBroken(false);
    setImageReady(false);
    setTimedOut(false);
    if (!subject) return;
    const timer = window.setTimeout(() => setTimedOut(true), POSTER_WAIT_MS);
    return () => window.clearTimeout(timer);
  }, [subject?.id, subject?.title, subject?.year, subject?.medium, subject?.imdbId]);

  return (
    <figure className={cn("min-w-0", props.className)}>
      <div
        className={cn(
          "overflow-hidden rounded-lg bg-muted/40 ring-1 ring-white/10",
          frame[size]
        )}
      >
        {poster && !broken ? (
          // Wikimedia / Wikipedia CDN; next/image domains are not listed for static Pages.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={poster.url}
            src={poster.url}
            alt=""
            className={cn(
              "h-full w-full object-contain object-center",
              imageReady ? "block" : "hidden"
            )}
            onLoad={() => {
              setBroken(false);
              setImageReady(true);
            }}
            onError={() => {
              setBroken(true);
              setImageReady(false);
            }}
          />
        ) : null}
        {!showImage ? (
          <div
            className={cn(
              "flex h-full w-full items-center justify-center px-2 text-center",
              size === "sm" ? "text-[9px] leading-tight" : "text-xs",
              waiting ? "text-muted-foreground" : "text-foreground"
            )}
          >
            {waiting ? (
              <span aria-hidden>Finding poster…</span>
            ) : imdbHref ? (
              <a
                href={imdbHref}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline underline-offset-2"
                onClick={(event) => event.stopPropagation()}
              >
                Open on IMDb
              </a>
            ) : (
              <span className="text-muted-foreground">No poster found</span>
            )}
          </div>
        ) : null}
      </div>
      {showImage && showCredit && poster ? (
        <figcaption
          className={cn(
            "mt-1.5 text-muted-foreground",
            size === "sm" ? "text-[10px]" : "text-xs",
            size === "tourney" && "hidden lg:block"
          )}
        >
          Image:{" "}
          <a
            href={poster.credit.href}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline underline-offset-2"
            onClick={(event) => event.stopPropagation()}
          >
            {poster.credit.label}
          </a>
        </figcaption>
      ) : missing && showCredit ? (
        <figcaption className="mt-1.5 text-xs text-muted-foreground">
          {imdbHref ? (
            <>
              Poster took too long or was missing.{" "}
              <a
                href={imdbHref}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline underline-offset-2"
                onClick={(event) => event.stopPropagation()}
              >
                IMDb page
              </a>
            </>
          ) : (
            "No Wikipedia or Wikimedia image"
          )}
        </figcaption>
      ) : null}
    </figure>
  );
}
