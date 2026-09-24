"use client";

type StageLoadingProps = {
  kicker: string;
  title: string;
  body: string;
};

export function StageLoading({ kicker, title, body }: StageLoadingProps) {
  return (
    <div className="flex flex-1 flex-col justify-center bg-background text-foreground" role="status" aria-live="polite">
      <span
        className="mb-5 size-10 animate-spin rounded-full border-2 border-muted border-t-primary"
        aria-hidden
      />
      <p className="text-sm font-medium tracking-wide text-primary uppercase">{kicker}</p>
      <h1 className="mt-2 font-heading text-3xl text-foreground">{title}</h1>
      <p className="mt-2 max-w-lg text-muted-foreground">{body}</p>
    </div>
  );
}
