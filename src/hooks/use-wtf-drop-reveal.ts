"use client";

import { dragDistanceReached } from "@/lib/wtf-drag";
import { useCallback, useRef, useState } from "react";

export function useWtfDropReveal() {
  const [visible, setVisible] = useState(false);
  const origin = useRef<{ x: number; y: number } | null>(null);
  const cleanup = useRef<(() => void) | null>(null);

  const hide = useCallback(() => {
    cleanup.current?.();
    cleanup.current = null;
    origin.current = null;
    setVisible(false);
  }, []);

  const begin = useCallback(
    (clientX: number, clientY: number) => {
      origin.current = { x: clientX, y: clientY };
      setVisible(false);
      if (cleanup.current) return;

      const onOver = (event: DragEvent) => {
        if (dragDistanceReached(origin.current, event.clientX, event.clientY)) {
          setVisible(true);
        }
      };
      const onEnd = () => hide();
      document.addEventListener("dragover", onOver);
      document.addEventListener("dragend", onEnd);
      cleanup.current = () => {
        document.removeEventListener("dragover", onOver);
        document.removeEventListener("dragend", onEnd);
      };
    },
    [hide]
  );

  return { visible, begin, hide };
}
