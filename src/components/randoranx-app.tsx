"use client";

import { AppHeader } from "@/components/app-header";
import { EmptyCatalog } from "@/components/empty-catalog";
import { Landing } from "@/components/landing";
import { ResultsLog, ResultsTable } from "@/components/results-log";
import { TitleStage } from "@/components/title-stage";
import { Button } from "@/components/ui/button";
import { useRandoRanx } from "@/hooks/use-randoranx";
import { useState } from "react";

export function RandoRanxApp() {
  const {
    session,
    status,
    errorMessage,
    currentTitle,
    chooseMedium,
    goHome,
    recordAndAdvance,
    reshuffleMedium,
    clearSession,
    dismissError,
  } = useRandoRanx();
  const [logOpen, setLogOpen] = useState(false);

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader
        onHome={goHome}
        onOpenLog={() => setLogOpen(true)}
        resultCount={session.responses.length}
        showHome={session.medium !== null}
      />

      <main className="no-print mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:px-6">
        {status === "loading" ? (
          <div className="flex flex-1 flex-col justify-center" role="status" aria-live="polite">
            <p className="text-sm font-medium tracking-wide text-amber-200/80 uppercase">
              Loading
            </p>
            <h1 className="mt-2 font-heading text-3xl">Shuffling the stacks…</h1>
            <p className="mt-2 text-muted-foreground">
              Restoring anything you already ranked on this device.
            </p>
          </div>
        ) : null}

        {errorMessage ? (
          <div
            className="mb-6 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm"
            role="alert"
          >
            <p className="font-medium text-destructive">Could not restore your last session</p>
            <p className="mt-1 text-foreground/80">{errorMessage}</p>
            <Button type="button" variant="outline" className="mt-3" onClick={dismissError}>
              Continue with a clean slate
            </Button>
          </div>
        ) : null}

        {status !== "loading" && !session.medium ? <Landing onChoose={chooseMedium} /> : null}

        {status !== "loading" && session.medium && currentTitle ? (
          <div className="flex flex-1 flex-col justify-center gap-4">
            <div className="flex items-center justify-between gap-3 text-sm text-muted-foreground">
              <p>
                {session.medium === "movie" ? "Movie stack" : "Game stack"} ·{" "}
                {session.remainingIds[session.medium].length} left including this one
              </p>
              <Button type="button" variant="ghost" size="sm" onClick={goHome}>
                Switch catalog
              </Button>
            </div>
            <TitleStage
              key={currentTitle.id}
              title={currentTitle}
              onRated={(rating, comments) => recordAndAdvance("rated", { rating, comments })}
              onSkip={() => recordAndAdvance("skipped")}
              onQueue={() => recordAndAdvance("queued")}
            />
          </div>
        ) : null}

        {status !== "loading" && session.medium && !currentTitle ? (
          <div className="flex flex-1 flex-col justify-center">
            <EmptyCatalog
              medium={session.medium}
              onHome={goHome}
              onReshuffle={reshuffleMedium}
            />
          </div>
        ) : null}
      </main>

      <ResultsLog
        open={logOpen}
        onOpenChange={setLogOpen}
        responses={session.responses}
        onClear={() => {
          clearSession();
          setLogOpen(false);
        }}
      />

      <section className="print-only hidden print:block p-6 text-black">
        <h1 className="mb-1 text-2xl font-semibold">RandoRanx results</h1>
        <p className="mb-6 text-sm">Session log printed from this browser.</p>
        <ResultsTable
          responses={session.responses}
          caption="Rated titles, skips, and the want-to-see / want-to-play queue"
        />
      </section>
    </div>
  );
}
