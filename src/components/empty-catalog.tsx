"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type EmptyCatalogProps = {
  medium: "movie" | "game";
  onHome: () => void;
  onReshuffle: () => void;
};

export function EmptyCatalog({ medium, onHome, onReshuffle }: EmptyCatalogProps) {
  const noun = medium === "movie" ? "movies" : "games";

  return (
    <Card className="border-none bg-card/80 ring-1 ring-white/10">
      <CardHeader>
        <CardTitle className="font-heading text-2xl">You worked through this stack</CardTitle>
        <CardDescription>
          Every {noun.slice(0, -1)} in the current {noun} catalog already has an answer in your log.
          Switch catalogs, or reshuffle only the titles you have not ranked if that should not be true.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2 sm:flex-row">
        <Button type="button" onClick={onHome} className="h-11">
          Back to Movies or Games
        </Button>
        <Button type="button" variant="outline" onClick={onReshuffle} className="h-11">
          Deal leftover titles
        </Button>
      </CardContent>
    </Card>
  );
}
