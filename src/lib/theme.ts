export const PALETTE_STORAGE_KEY = "randoranx-palette";

export const PALETTE_IDS = ["midnight", "arcade", "pine", "daylight"] as const;

export type PaletteId = (typeof PALETTE_IDS)[number];

export const PALETTES: Array<{
  id: PaletteId;
  label: string;
  note: string;
  swatches: [string, string, string];
}> = [
  {
    id: "midnight",
    label: "Midnight Gold",
    note: "Current default",
    swatches: ["#2d2418", "#e6c35c", "#f4efe4"],
  },
  {
    id: "arcade",
    label: "Arcade Night",
    note: "Magenta on navy",
    swatches: ["#16122b", "#ff4ecd", "#c8f4ff"],
  },
  {
    id: "pine",
    label: "Pine Screen",
    note: "Forest and moss",
    swatches: ["#10241c", "#7dce9a", "#e7f6ec"],
  },
  {
    id: "daylight",
    label: "Daylight",
    note: "Paper and ink",
    swatches: ["#f4efe4", "#c45c26", "#1c1914"],
  },
];

export function isPaletteId(value: string | null): value is PaletteId {
  return PALETTE_IDS.includes(value as PaletteId);
}

export function readStoredPalette(): PaletteId {
  if (typeof window === "undefined") return "midnight";
  try {
    const raw = window.localStorage.getItem(PALETTE_STORAGE_KEY);
    return isPaletteId(raw) ? raw : "midnight";
  } catch {
    return "midnight";
  }
}

export function applyPalette(id: PaletteId) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-palette", id);
  root.classList.toggle("dark", id !== "daylight");
  try {
    window.localStorage.setItem(PALETTE_STORAGE_KEY, id);
  } catch {
    // private mode
  }
}
