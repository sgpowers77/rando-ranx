export const PALETTE_STORAGE_KEY = "randoranx-palette";

export const PALETTE_IDS = [
  "midnight",
  "arcade",
  "pine",
  "daylight",
  "void",
  "cabin",
  "sky",
  "harbor",
  "pale",
  "orchid",
  "neon",
  "blush",
  "graphite",
  "steel",
  "wine",
  "olive",
  "taupe",
  "brass",
] as const;

export type PaletteId = (typeof PALETTE_IDS)[number];

export const LIGHT_PALETTE_IDS: readonly PaletteId[] = [
  "daylight",
  "sky",
  "pale",
  "blush",
  "olive",
];

export const PALETTES: Array<{
  id: PaletteId;
  label: string;
  note: string;
  swatches: string[];
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
  {
    id: "void",
    label: "Void Signal",
    note: "Indigo, blue, magenta",
    swatches: ["#04030b", "#120845", "#0061cb", "#9e0084"],
  },
  {
    id: "cabin",
    label: "Cabin Moss",
    note: "Charcoal, sage, clay",
    swatches: ["#161313", "#2d223f", "#6e9762", "#a56b3f"],
  },
  {
    id: "sky",
    label: "Clear Sky",
    note: "White, blue, amber",
    swatches: ["#ffffff", "#0088e5", "#dc7c0b", "#fb9a25"],
  },
  {
    id: "harbor",
    label: "Harbor Gold",
    note: "Teal and gold",
    swatches: ["#011218", "#00374b", "#0d6584", "#e2a22d"],
  },
  {
    id: "pale",
    label: "Pale Harbor",
    note: "Ice and slate",
    swatches: ["#f5fbfb", "#b0ced7", "#577387", "#2c3e46"],
  },
  {
    id: "orchid",
    label: "Orchid Amber",
    note: "Violet, magenta, gold",
    swatches: ["#211f32", "#451f81", "#b72e74", "#efab53"],
  },
  {
    id: "neon",
    label: "Neon Ticket",
    note: "Navy, pink, peach",
    swatches: ["#091f49", "#004066", "#ff509d", "#febe9c"],
  },
  {
    id: "blush",
    label: "Blush Note",
    note: "Peach and plum",
    swatches: ["#f5fbfb", "#fcc1b3", "#ab3f68", "#4c2250"],
  },
  {
    id: "graphite",
    label: "Graphite",
    note: "Charcoal and linen",
    swatches: ["#171818", "#3f3e3a", "#90908e", "#c1bbaa"],
  },
  {
    id: "steel",
    label: "Steel Marquee",
    note: "Gray and gold",
    swatches: ["#3a3f42", "#5c6b70", "#e8aa61", "#f7c586"],
  },
  {
    id: "wine",
    label: "Wine Mint",
    note: "Burgundy, rose, mint",
    swatches: ["#1a0a10", "#412662", "#ce3a57", "#7fe2b6"],
  },
  {
    id: "olive",
    label: "Olive Print",
    note: "Paper and olive",
    swatches: ["#f1f0f1", "#6f8629", "#212a0a", "#4e5f24"],
  },
  {
    id: "taupe",
    label: "Warm Slate",
    note: "Taupe and sand",
    swatches: ["#2c2626", "#75746e", "#989692", "#c7b587"],
  },
  {
    id: "brass",
    label: "Navy Brass",
    note: "Navy and brass",
    swatches: ["#0d1f38", "#1c3456", "#a57b4d", "#d0b76e"],
  },
];

export function isPaletteId(value: string | null): value is PaletteId {
  return PALETTE_IDS.includes(value as PaletteId);
}

export function isLightPalette(id: PaletteId): boolean {
  return LIGHT_PALETTE_IDS.includes(id);
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
  root.classList.toggle("dark", !isLightPalette(id));
  try {
    window.localStorage.setItem(PALETTE_STORAGE_KEY, id);
  } catch {
    // private mode
  }
}
