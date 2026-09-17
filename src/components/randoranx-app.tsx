"use client";

import { AppHeader } from "@/components/app-header";
import { EmptyCatalog } from "@/components/empty-catalog";
import { EntryEditor } from "@/components/entry-editor";
import { Landing } from "@/components/landing";
import { ModePicker } from "@/components/mode-picker";
import { ResultsLog, ResultsTable } from "@/components/results-log";
import { SessionLog } from "@/components/session-log";
import { TitleStage } from "@/components/title-stage";
import { TourneyStage } from "@/components/tourney-stage";
import { PathSettings } from "@/components/path-settings";
import { TitleSearch } from "@/components/title-search";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { defaultFilters, pathKey } from "@/lib/filters";
import { useRandoRanx } from "@/hooks/use-randoranx";
import { useMemo, useState } from "react";

export function RandoRanxApp() {
  const {
    session,
    status,
    errorMessage,
    currentTitle,
    tourneyPair,
    leftoverTitle,
    pendingWinner,
    eligibleCount,
    remainingVisible,
    chooseMedium,
    choosePlayMode,
    goHome,
    goToModePick,
    recordAndAdvance,
    pickTourneyWinner,
    cancelTourneyPick,
    completeTourneyRound,
    setSkipTourneyScoring,
    savePathFilters,
    useSearchedTitle,
    addWatchTag,
    updateResponse,
    reshuffleMedium,
    clearSession,
    dismissError,
  } = useRandoRanx();
  const [printOpen, setPrintOpen] = useState(false);
  const [mobileLogOpen, setMobileLogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const editingEntry = useMemo(
    () => session.responses.find((entry) => entry.id === editingId) ?? null,
    [editingId, session.responses]
  );

  const selectEntry = (id: string) => {
    setEditingId(id);
    setMobileLogOpen(false);
  };

  const stopEditing = () => setEditingId(null);

  const log = (
    <SessionLog
      responses={session.responses}
      discards={session.discards}
      watchTags={session.watchTags}
      selectedId={editingId}
      onSelect={selectEntry}
    />
  );

  const remainingCount = remainingVisible;
  const ready = status !== "loading";
  const showLanding = ready && !editingEntry && !session.medium;
  const showModePick = ready && !editingEntry && session.medium && !session.playMode;
  const showRank =
    ready && !editingEntry && session.playMode === "rank" && Boolean(currentTitle);
  const showTourney =
    ready && !editingEntry && session.playMode === "tourney" && Boolean(tourneyPair);
  const showEmpty =
    ready &&
    !editingEntry &&
    session.playMode &&
    ((session.playMode === "rank" && !currentTitle) ||
      (session.playMode === "tourney" && !tourneyPair));

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader
        onHome={() => {
          stopEditing();
          goHome();
        }}
        onOpenPrint={() => setPrintOpen(true)}
        onOpenMobileLog={() => setMobileLogOpen(true)}
        resultCount={session.responses.length + session.discards.length}
        showHome={session.medium !== null || editingEntry !== null}
      />

      <div className="flex min-h-0 flex-1">
        <aside className="no-print hidden w-80 shrink-0 border-r border-border/70 bg-card/40 lg:flex lg:flex-col">
          {log}
        </aside>

        <main className="no-print mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 py-8 sm:px-6">
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

          {ready && editingEntry ? (
            <div className="flex flex-1 flex-col justify-center">
              <EntryEditor
                key={editingEntry.id}
                entry={editingEntry}
                onSave={(kind, extras) => updateResponse(editingEntry.id, kind, extras)}
                onCancel={stopEditing}
              />
            </div>
          ) : null}

          {showLanding ? <Landing onChoose={chooseMedium} onResetAll={clearSession} /> : null}

          {showModePick && session.medium ? (
            <ModePicker
              medium={session.medium}
              filtersByMode={{
                rank: session.pathFilters[pathKey(session.medium, "rank")] ?? defaultFilters(session.medium),
                tourney:
                  session.pathFilters[pathKey(session.medium, "tourney")] ??
                  defaultFilters(session.medium),
              }}
              onChoose={choosePlayMode}
              onSaveFilters={(playMode, filters) => {
                if (!session.medium) return;
                savePathFilters(session.medium, playMode, filters);
              }}
              onUseSearch={useSearchedTitle}
              onBack={goHome}
            />
          ) : null}

          {showRank && currentTitle ? (
            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-4">
              <StageMeta
                label={`Rank · ${session.medium === "movie" ? "Movies" : "Games"} · ${remainingCount} left including this one`}
                onChangeMode={goToModePick}
                onHome={goHome}
                onOpenSettings={() => setSettingsOpen(true)}
              />
              <TitleStage
                key={currentTitle.id}
                title={currentTitle}
                onRated={(rating, comments) => recordAndAdvance("rated", { rating, comments })}
                onSkip={() => recordAndAdvance("skipped")}
                onQueue={() => recordAndAdvance("queued")}
              />
              <TitleSearch medium={currentTitle.medium} onUse={useSearchedTitle} />
            </div>
          ) : null}

          {showTourney && tourneyPair ? (
            <div className="flex flex-1 flex-col justify-center gap-4">
              <StageMeta
                label={`Tourney · ${session.medium === "movie" ? "Movies" : "Games"} · ${remainingCount} left in this stack`}
                onChangeMode={goToModePick}
                onHome={goHome}
                onOpenSettings={() => setSettingsOpen(true)}
              />
              <TourneyStage
                key={`${tourneyPair[0].id}-${tourneyPair[1].id}-${pendingWinner?.id ?? "open"}`}
                pair={tourneyPair}
                pendingWinner={pendingWinner}
                skipScoring={session.skipTourneyScoring}
                onPick={pickTourneyWinner}
                onCancelPick={cancelTourneyPick}
                onComplete={completeTourneyRound}
                onSkipScoringChange={setSkipTourneyScoring}
                onWatchlist={addWatchTag}
              />
              <TitleSearch medium={tourneyPair[0].medium} onUse={useSearchedTitle} />
            </div>
          ) : null}

          {showEmpty && session.medium && session.playMode ? (
            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center">
              <EmptyCatalog
                medium={session.medium}
                playMode={session.playMode}
                leftoverTitle={leftoverTitle?.title ?? null}
                filterEmpty={eligibleCount === 0}
                onHome={goHome}
                onChangeMode={goToModePick}
                onReshuffle={reshuffleMedium}
              />
            </div>
          ) : null}
        </main>
      </div>

      <Sheet open={mobileLogOpen} onOpenChange={setMobileLogOpen}>
        <SheetContent side="left" className="w-full gap-0 p-0 sm:max-w-sm" showCloseButton>
          <SheetHeader className="sr-only">
            <SheetTitle>Session log</SheetTitle>
          </SheetHeader>
          {log}
        </SheetContent>
      </Sheet>

      {session.medium && session.playMode ? (
        <PathSettings
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
          medium={session.medium}
          filtersByMode={{
            rank: session.pathFilters[pathKey(session.medium, "rank")] ?? defaultFilters(session.medium),
            tourney:
              session.pathFilters[pathKey(session.medium, "tourney")] ?? defaultFilters(session.medium),
          }}
          onSave={(playMode, filters) => {
            if (!session.medium) return;
            savePathFilters(session.medium, playMode, filters);
          }}
        />
      ) : null}

      <ResultsLog
        open={printOpen}
        onOpenChange={setPrintOpen}
        responses={session.responses}
        discards={session.discards}
        onClear={() => {
          clearSession();
          setPrintOpen(false);
          setEditingId(null);
        }}
      />

      <section className="print-only hidden p-6 text-black print:block">
        <h1 className="mb-1 text-2xl font-semibold">RandoRanx results</h1>
        <p className="mb-6 text-sm">Session log printed from this browser.</p>
        <ResultsTable
          responses={session.responses}
          discards={session.discards}
          caption="Rated titles, skips, the want list, and Tourney discards"
        />
      </section>
    </div>
  );
}

function StageMeta({
  label,
  onChangeMode,
  onHome,
  onOpenSettings,
}: {
  label: string;
  onChangeMode: () => void;
  onHome: () => void;
  onOpenSettings: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <p>{label}</p>
      <div className="flex flex-wrap gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={onOpenSettings}>
          Path settings
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onChangeMode}>
          Rank or Tourney
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={onHome}>
          Switch catalog
        </Button>
      </div>
    </div>
  );
}
