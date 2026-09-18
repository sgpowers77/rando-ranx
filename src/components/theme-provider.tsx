"use client";

import { applyPalette, readStoredPalette, type PaletteId } from "@/lib/theme";
import { useEffect, useState } from "react";

export function ThemeHydrator() {
  useEffect(() => {
    applyPalette(readStoredPalette());
  }, []);
  return null;
}

export function usePalette() {
  const [palette, setPalette] = useState<PaletteId>("midnight");

  useEffect(() => {
    setPalette(readStoredPalette());
  }, []);

  const choose = (id: PaletteId) => {
    applyPalette(id);
    setPalette(id);
  };

  return { palette, choose };
}
