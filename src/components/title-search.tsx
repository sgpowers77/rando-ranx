"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CatalogTitle, Medium, PlayMode } from "@/lib/types";
import { useState } from "react";

type TitleSearchProps = {
  medium: Medium;
  onUse: (title: CatalogTitle, playMode: PlayMode) => void;
};

type SearchResponse = {
  results: CatalogTitle[];
  source: "wikipedia" | "local" | "none";
};

export function TitleSearch({ medium, onUse }: TitleSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CatalogTitle[]>([]);
  const [source, setSource] = useState<SearchResponse["source"] | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");

  const noun = medium === "movie" ? "film" : "game";

  async function runSearch(event: React.FormEvent) {
    event.preventDefault();
    if (query.trim().length < 2) return;
    setStatus("loading");
    try {
      const res = await fetch(
        `/api/title-search?q=${encodeURIComponent(query.trim())}&medium=${medium}`
      );
      if (!res.ok) throw new Error("search failed");
      const data = (await res.json()) as SearchResponse;
      setResults(data.results);
      setSource(data.source);
      setStatus("idle");
    } catch {
      setStatus("error");
      setResults([]);
    }
  }

  return (
    <div className="rounded-xl border border-border/70 bg-card/50 p-4">
      <p className="text-sm font-medium">
        Search {medium === "movie" ? "films on Wikipedia" : "games on Wikipedia"}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        Look up any {noun} Wikipedia knows. If the live lookup is down, RandoRanx falls back to a
        local list. Use a result in Rank or Tourney.
      </p>
      <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={runSearch}>
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={medium === "movie" ? "Search a film title" : "Search a game title"}
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
        <ul className="mt-3 space-y-2">
          {results.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-2 rounded-lg bg-background/60 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <p className="font-medium">
                  {item.title}{" "}
                  <span className="text-sm font-normal text-muted-foreground">{item.year}</span>
                </p>
                <p className="text-xs text-muted-foreground">{item.genres.join(" · ")}</p>
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={() => onUse(item, "rank")}>
                  Use in Rank
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => onUse(item, "tourney")}>
                  Use in Tourney
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
