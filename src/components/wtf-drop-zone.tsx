"use client";

export const TITLE_DRAG_TYPE = "application/x-randoranx-title";

export function WtfDropZone({
  armed,
  onArmed,
  onDropId,
}: {
  armed: boolean;
  onArmed: (armed: boolean) => void;
  onDropId: (id: string) => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="WTF drop zone. Drop a title card for a short description."
      onDragOver={(event) => {
        event.preventDefault();
        onArmed(true);
      }}
      onDragLeave={() => onArmed(false)}
      onDrop={(event) => {
        event.preventDefault();
        const raw = event.dataTransfer.getData(TITLE_DRAG_TYPE) || event.dataTransfer.getData("text/plain");
        onArmed(false);
        if (raw) onDropId(raw);
      }}
      className={`fixed bottom-6 left-1/2 z-40 w-[min(20rem,calc(100%-2rem))] -translate-x-1/2 rounded-2xl border-2 border-dashed px-6 py-5 text-center shadow-lg ${
        armed
          ? "border-primary bg-primary/20 text-foreground"
          : "border-amber-200/70 bg-background/95 text-amber-100"
      }`}
    >
      <p className="font-heading text-2xl tracking-tight">WTF??</p>
      <p className="mt-1 text-xs text-muted-foreground">Drop a card for a quick description</p>
    </div>
  );
}
