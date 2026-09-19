import type { CatalogTitle } from "@/lib/types";

/** High-end anchors from The Movies Dataset (budget USD, TMDb popularity, vote counts). */
function unitLog(value: number, high: number): number {
  if (!Number.isFinite(value) || value <= 0 || high <= 0) return 0;
  return Math.min(1, Math.log1p(value) / Math.log1p(high));
}

export type ObscuritySignals = {
  budget?: number;
  revenue?: number;
  popularity?: number;
  voteCount?: number;
  voteAverage?: number;
};

/**
 * Maps 1 (wide release) to 5 (little-seen) from catalog fields only:
 * production budget, marketing/exposure (popularity + revenue), public sentiment
 * (vote average, weighted by votes), and attention/prestige proxy (vote count).
 * Director names are not in the dataset.
 */
export function obscurityFromSignals(signals: ObscuritySignals): CatalogTitle["obscurity"] {
  const budget = Number(signals.budget) || 0;
  const revenue = Number(signals.revenue) || 0;
  const popularity = Number(signals.popularity) || 0;
  const voteCount = Number(signals.voteCount) || 0;
  const voteAverage = Number(signals.voteAverage) || 0;

  const production = unitLog(budget, 150_000_000);
  const marketing = Math.max(unitLog(popularity, 30), unitLog(revenue, 400_000_000));
  const prestige = unitLog(voteCount, 5_000);
  const sentimentWeight = Math.min(1, Math.log1p(voteCount) / Math.log1p(250));
  const sentiment = sentimentWeight * Math.max(0, Math.min(1, (voteAverage - 4.5) / 4.5));
  const fame = 0.3 * production + 0.3 * marketing + 0.25 * prestige + 0.15 * sentiment;

  if (fame >= 0.72) return 1;
  if (fame >= 0.5) return 2;
  if (fame >= 0.32) return 3;
  if (fame >= 0.16) return 4;
  return 5;
}

export const MOVIE_OBSCURITY_COPY: Record<number, string> = {
  1: "1 · Wide release / high exposure",
  2: "2 · Broadly circulated",
  3: "3 · Known if you follow film",
  4: "4 · Limited run / cult",
  5: "5 · Little-seen / low exposure",
};

export const GAME_OBSCURITY_COPY: Record<number, string> = {
  1: "1 · AAA+ Blockbuster",
  2: "2 · AA Mid-Market Production",
  3: "3 · A • Independent Studio",
  4: "4 · Cult / Niche Release",
  5: "5 · Micro-Indie / Ultra Obscure",
};

export const MUSIC_OBSCURITY_COPY: Record<number, string> = {
  1: "1 · Chart / canonical",
  2: "2 · Widely circulated",
  3: "3 · Known if you follow music",
  4: "4 · Cult / crate-digger",
  5: "5 · Obscure / private press",
};
