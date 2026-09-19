"use client";

import { TitlePoster } from "@/components/title-poster";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { catalogNoun, wikiHint } from "@/lib/medium";
import { searchWikipediaClient } from "@/lib/wiki-client";
import type { CatalogTitle, Medium } from "@/lib/types";
import { useState } from "react";

type TitleSearchProps = {
  medium: Medium;
  queuedIds?: string[];
  onQueue: (titles: CatalogTitle[]) => void;
};

type SearchResponse = {
  results: CatalogTitle[];
  source: "wikipedia" | "local" | "none";
};

export function TitleSearch({ medium, queuedIds = [], onQueue }: TitleSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogTitle[]>([]);
  const [source, setSource] = useState<SearchResponse["source"] | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [selected, setSelected] = useState<string[]>([]);

  const noun = wikiHint(medium);
  const queued = new Set(queuedIds);

  async function runSearch(event: React.FormEvent) {
    event.preventDefault();
    if (query.trim().length < 2) return;
    setStatus("loading");
    try {
      const data = await searchWikipediaClient(query.trim(), medium);
      setResults(data.results);
      setSource(data.source);
      setSelected([]);
      setStatus("idle");
    } catch {
      setStatus("error");
      setResults([]);
    }
  }

  const toggle = (id: string) => {
    setSelected((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const picked = results.filter((item) => selected.includes(item.id) && !queued.has(item.id));

  return (
    <div className="rounded-xl border border-border/70 bg-card/50 p-4">
      <p className="text-sm font-medium">
        Search {catalogNoun(medium)} on Wikipedia
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Build your own custom queue by searching titles from Wikipedia.com. Queue can be viewed and
        edited from the Queue icon to the right of the catalog log.
      </p>
      <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={runSearch}>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`Search ${medium === "movie" ? "a film" : medium === "music" ? "an album" : "a game"} title`}
          aria-label={`Search ${noun}s`}
        />
        <Button type="submit" disabled={status === "loading" || query.trim().length < 2}>
          {status === "loading" ? "Searching…" : "Search"}
        </Button>
      </form>
      {status === "error" ? (
        <p className="mt-3 text-sm text-destructive" role="alert">
          Search could not reach Wikipedia. Try again, or keep using the built-in stack.
        </p>
      ) : null}
      {source === "local" ? (
        <p className="mt-3 text-xs text-muted-foreground">Showing local fallback matches.</p>
      ) : null}
      {status === "idle" && source && results.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">No matching {noun}s. Try another title.</p>
      ) : null}
      {results.length > 0 ? (
        <div className="mt-3 space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">
              {picked.length} selected · checkboxes queue several at once
            </p>
            <Button
              type="button"
              size="sm"
              disabled={picked.length === 0}
              onClick={() => {
                onQueue(picked);
                setSelected([]);
              }}
            >
              Queue
            </Button>
          </div>
          <ul className="space-y-2">
            {results.map((item) => {
              const already = queued.has(item.id);
              const checked = selected.includes(item.id);
              const checkId = `queue-${item.id}`;
              return (
                <li
                  key={item.id}
                  className="flex flex-col gap-2 rounded-lg bg-background/60 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <label htmlFor={checkId} className="flex min-w-0 items-start gap-3">
                    <Checkbox
                      id={checkId}
                      checked={already || checked}
                      disabled={already}
                      onCheckedChange={() => toggle(item.id)}
                      className="mt-1"
                    />
                    <TitlePoster catalog={item} size="sm" showCredit />
                    <div className="min-w-0">
                      <p className="font-medium">
                        {item.title}{" "}
                        <span className="text-sm font-normal text-muted-foreground">{item.year}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{item.genres.join(" · ")}</p>
                    </div>
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={already}
                    onClick={() => onQueue([item])}
                  >
                    {already ? "Queued" : "Queue"}
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
