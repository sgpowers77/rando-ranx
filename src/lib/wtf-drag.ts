/** Pixels the pointer must travel after dragstart before WTF?? appears. */
export const WTF_DRAG_REVEAL_PX = 120;

export function dragDistanceReached(
  origin: { x: number; y: number } | null,
  clientX: number,
  clientY: number,
  threshold = WTF_DRAG_REVEAL_PX
): boolean {
  if (!origin) return false;
  if (clientX === 0 && clientY === 0) return false;
  return Math.hypot(clientX - origin.x, clientY - origin.y) >= threshold;
}
