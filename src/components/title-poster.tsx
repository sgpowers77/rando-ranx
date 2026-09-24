"use client";

import { usePoster } from "@/hooks/use-poster";
import { titlePageLink } from "@/lib/imdb";
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
  lg: "relative isolate h-72 w-48 max-w-none",
  md: "relative isolate aspect-[2/3] w-full max-w-[16rem] sm:max-w-[18rem]",
  sm: "relative isolate h-28 w-[4.67rem] shrink-0",
  tourney: "relative isolate h-40 w-[6.67rem] shrink-0 lg:h-96 lg:w-64",
};

const POSTER_WAIT_MS = 10000;

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
  const pageLink = subject
    ? titlePageLink({
        title: subject.title,
        year: subject.year,
        medium: subject.medium,
        imdbId: subject.imdbId ?? catalog?.imdbId,
        musicbrainzId: subject.musicbrainzId ?? catalog?.musicbrainzId,
        artist: subject.artist ?? catalog?.artist,
      })
    : null;
  const pageHref =
    subject?.medium === "music" && poster?.credit.href ? poster.credit.href : (pageLink?.href ?? null);
  const pageLabel = subject?.medium === "music" ? "Wikipedia" : (pageLink?.label ?? "IMDb");
  const waiting = !showImage && !timedOut && status !== "missing" && !broken;
  const missing = !showImage && (timedOut || status === "missing" || broken);

  useEffect(() => {
    setBroken(false);
    setImageReady(false);
    setTimedOut(false);
    if (!subject) return;
    const timer = window.setTimeout(() => setTimedOut(true), POSTER_WAIT_MS);
    return () => window.clearTimeout(timer);
  }, [subject?.id, subject?.title, subject?.year, subject?.medium, subject?.imdbId, subject?.steamAppId, subject?.imageUrl, subject?.musicbrainzId, subject?.artist]);

  return (
    <figure className={cn("shrink-0", props.className)}>
      <div
        className={cn(
          "overflow-hidden rounded-lg bg-muted/50 text-primary ring-1 ring-primary/20",
          frame[size]
        )}
      >
        {poster && !broken ? (
          pageHref ? (
            <a
              href={pageHref}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${subject?.title ?? "title"} on ${pageLabel}`}
              className={cn(
                "absolute inset-0 z-0",
                imageReady ? "pointer-events-auto" : "pointer-events-none"
              )}
              draggable={false}
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
            >
              {/* Wikimedia / Wikipedia CDN; next/image domains are not listed for static Pages. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                key={poster.url}
                src={poster.url}
                alt=""
                draggable={false}
                className={cn(
                  "h-full w-full object-contain object-center",
                  imageReady ? "opacity-100" : "opacity-0"
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
            </a>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={poster.url}
              src={poster.url}
              alt=""
              draggable={false}
              className={cn(
                "absolute inset-0 z-0 h-full w-full object-contain object-center",
                imageReady ? "opacity-100" : "opacity-0"
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
          )
        ) : null}
        {!showImage ? (
          waiting ? (
            <div
              className={cn(
                "absolute inset-0 z-[1] flex items-center justify-center px-2 text-center text-muted-foreground",
                size === "sm" ? "text-[9px] leading-tight" : "text-xs"
              )}
            >
              <span aria-hidden>Finding poster…</span>
            </div>
          ) : pageHref ? (
            <a
              href={pageHref}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${subject?.title ?? "title"} on ${pageLabel}`}
              className={cn(
                "absolute inset-0 z-[1] flex items-center justify-center px-2 text-center text-primary underline underline-offset-2",
                size === "sm" ? "text-[9px] leading-tight" : "text-xs"
              )}
              onClick={(event) => event.stopPropagation()}
            >
              Open on {pageLabel}
            </a>
          ) : (
            <div
              className={cn(
                "absolute inset-0 z-[1] flex items-center justify-center px-2 text-center text-muted-foreground",
                size === "sm" ? "text-[9px] leading-tight" : "text-xs"
              )}
            >
              No poster found
            </div>
          )
        ) : null}
      </div>
      {showImage && showCredit && poster ? (
        <figcaption
          className={cn(
            "mt-1.5 h-8 overflow-hidden text-muted-foreground",
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
      ) : showCredit ? (
        <figcaption
          className={cn(
            "mt-1.5 h-8 overflow-hidden text-xs text-muted-foreground",
            size === "tourney" && "hidden lg:block"
          )}
          aria-hidden={!missing}
        >
          {missing && !pageHref ? "No Wikipedia or Wikimedia image" : null}
        </figcaption>
      ) : null}
    </figure>
  );
}
