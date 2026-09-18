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
      onDragEnter={(event) => {
        event.preventDefault();
        onArmed(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy";
        onArmed(true);
      }}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node)) return;
        onArmed(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const raw =
          event.dataTransfer.getData("text/plain") ||
          event.dataTransfer.getData(TITLE_DRAG_TYPE) ||
          "";
        onArmed(false);
        onDropId(raw);
      }}
      className={`fixed bottom-4 left-1/2 z-50 w-[min(28rem,calc(100%-1rem))] -translate-x-1/2 rounded-2xl border-2 border-dashed px-6 py-8 text-center shadow-lg [&>*]:pointer-events-none ${
        armed
          ? "border-primary bg-primary/20 text-foreground"
          : "border-primary/70 bg-background/95 text-primary"
      }`}
    >
      <p className="font-heading text-2xl tracking-tight">WTF??</p>
      <p className="mt-1 text-xs text-muted-foreground">Drop a card for a quick description</p>
    </div>
  );
}
