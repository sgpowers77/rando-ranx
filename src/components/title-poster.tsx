"use client";

import { usePoster } from "@/hooks/use-poster";
import { catalogPosterSubject } from "@/lib/poster";
import type { CatalogTitle, Medium } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useState } from "react";

type PosterSize = "lg" | "md" | "sm";

type TitlePosterProps = {
  title?: string;
  year?: number;
  medium?: Medium;
  imdbId?: string;
  id?: string;
  imageUrl?: string;
  imageCreditLabel?: string;
  imageCreditHref?: string;
  catalog?: CatalogTitle;
  size?: PosterSize;
  className?: string;
  showCredit?: boolean;
};

const frame: Record<PosterSize, string> = {
  lg: "aspect-[2/3] w-full max-w-[14rem] sm:max-w-[16rem]",
  md: "aspect-[2/3] w-full max-h-56",
  sm: "h-16 w-11 shrink-0",
};

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
          imageUrl: props.imageUrl,
          imageCreditLabel: props.imageCreditLabel,
          imageCreditHref: props.imageCreditHref,
        }
      : null;
  const { poster, status } = usePoster(subject);
  const [broken, setBroken] = useState(false);
  const size = props.size ?? "md";
  const showCredit = props.showCredit ?? size !== "sm";
  const showImage = poster && !broken;
  const missing = !showImage && status !== "loading";

  return (
    <figure className={cn("min-w-0", props.className)}>
      <div
        className={cn(
          "overflow-hidden rounded-lg bg-muted/40 ring-1 ring-white/10",
          frame[size]
        )}
      >
        {showImage ? (
          // Wikimedia / Wikipedia CDN; next/image domains are not listed for static Pages.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={poster.url}
            src={poster.url}
            alt=""
            className="h-full w-full object-cover"
            onLoad={() => setBroken(false)}
            onError={() => setBroken(true)}
          />
        ) : (
          <div
            className={cn(
              "flex h-full w-full items-center justify-center px-2 text-center text-muted-foreground",
              size === "sm" ? "text-[9px] leading-tight" : "text-xs"
            )}
            aria-hidden={status === "loading"}
          >
            {status === "loading" ? "Finding poster…" : "No poster found"}
          </div>
        )}
      </div>
      {showImage && showCredit ? (
        <figcaption className={cn("mt-1.5 text-muted-foreground", size === "sm" ? "text-[10px]" : "text-xs")}>
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
        <figcaption className="mt-1.5 text-xs text-muted-foreground">No Wikipedia or Wikimedia image</figcaption>
      ) : null}
    </figure>
  );
}
