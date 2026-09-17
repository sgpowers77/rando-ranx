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
import { QueueModal } from "@/components/queue-modal";
import { TitleSearch } from "@/components/title-search";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { defaultFilters, pathKey } from "@/lib/filters";
import { queuedForMedium } from "@/lib/session";
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
    eligibleCount,
    remainingVisible,
    poolStatus,
    poolError,
    poolSource,
    chooseMedium,
    choosePlayMode,
    goHome,
    goToModePick,
    recordAndAdvance,
    pickTourneyWinner,
    savePathFilters,
    queueSearchedTitles,
    removeFromUserQueue,
    setPresentQueuedOnly,
    addWatchTag,
    toggleWatchTag,
    updateResponse,
    reshuffleMedium,
    skipTourneyMatchup,
    undoTourneyPick,
    beginFinalRound,
    clearSession,
    dismissError,
    finalRoundActive,
    tourneyUndoCount,
    contenderCount,
  } = useRandoRanx();
  const [printOpen, setPrintOpen] = useState(false);
  const [mobileLogOpen, setMobileLogOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [tourneyHelpOpen, setTourneyHelpOpen] = useState(false);

  const mediumQueue = session.medium ? queuedForMedium(session, session.medium) : session.userQueue;
  const showQueueIcon = (session.userQueue?.length ?? 0) > 0;

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
      onFinalRound={() => {
        stopEditing();
        setMobileLogOpen(false);
        beginFinalRound();
      }}
      canFinalRound={contenderCount >= 2}
      finalRoundActive={finalRoundActive}
      contenderCount={contenderCount}
      hideDiscard={session.playMode === "rank"}
      playMode={session.playMode}
      queueCount={session.userQueue?.length ?? 0}
      onOpenQueue={showQueueIcon ? () => setQueueOpen(true) : undefined}
    />
  );

  const remainingCount = remainingVisible;
  const ready = status !== "loading";
  const poolLoading = poolStatus === "loading";
  const showLanding = ready && !editingEntry && !session.medium;
  const showModePick = ready && !editingEntry && session.medium && !session.playMode;
  const showRank =
    ready && !editingEntry && session.playMode === "rank" && Boolean(currentTitle) && !poolLoading;
  const showTourney =
    ready && !editingEntry && session.playMode === "tourney" && Boolean(tourneyPair) && !poolLoading;
  const showPoolLoading =
    ready && !editingEntry && Boolean(session.playMode) && poolLoading;
  const showEmpty =
    ready &&
    !editingEntry &&
    session.playMode &&
    !poolLoading &&
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
        onOpenTourneyHelp={() => setTourneyHelpOpen(true)}
        resultCount={session.responses.length + session.discards.length}
        showHome={session.medium !== null || editingEntry !== null}
        showTourneyHelp={Boolean(showTourney)}
      />

      <div className="flex min-h-0 flex-1">
        <aside className="no-print hidden w-80 shrink-0 border-r border-border/70 bg-card/40 lg:flex lg:flex-col">
          {log}
        </aside>

        <main className={`no-print mx-auto flex w-full max-w-3xl flex-1 flex-col px-4 sm:px-6 ${showTourney ? "py-3 lg:py-8" : "py-8"}`}>
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
              onBack={goHome}
            />
          ) : null}

          {showPoolLoading ? (
            <div className="flex flex-1 flex-col justify-center" role="status" aria-live="polite">
              <p className="text-sm font-medium tracking-wide text-amber-200/80 uppercase">
                Live catalog
              </p>
              <h1 className="mt-2 font-heading text-3xl">
                {session.medium === "movie"
                  ? "Sampling The Movies Dataset…"
                  : "Shuffling game titles…"}
              </h1>
              <p className="mt-2 text-muted-foreground">
                {session.medium === "movie"
                  ? "Dealing films from movies_metadata.csv using release date, genres, and vote/popularity. Wikipedia stays on search and WTF blurbs."
                  : "Pulling a fresh game stack that matches your path filters."}
              </p>
            </div>
          ) : null}
          {showRank && currentTitle ? (
            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-4">
              <StageMeta
                label={`Ranx · ${session.medium === "movie" ? "Movies" : "Games"} · ${remainingCount} in this deal${poolSource === "dataset" ? " · Movies Dataset" : ""}`}
                onChangeMode={goToModePick}
                onHome={goHome}
                onOpenSettings={() => setSettingsOpen(true)}
              />
              <TitleStage
                key={currentTitle.id}
                title={currentTitle}
                watched={session.watchTags.some((tag) => tag.titleId === currentTitle.id)}
                onToggleWatch={() => toggleWatchTag(currentTitle)}
                onWatchlist={addWatchTag}
                onRated={(rating, comments) => recordAndAdvance("rated", { rating, comments })}
                onSkip={() => recordAndAdvance("skipped")}
                onQueue={() => recordAndAdvance("queued")}
              />
              <TitleSearch
                medium={currentTitle.medium}
                queuedIds={mediumQueue.map((item) => item.id)}
                onQueue={queueSearchedTitles}
              />
            </div>
          ) : null}

          {showTourney && tourneyPair ? (
            <div className="flex flex-1 flex-col justify-center gap-4">
              <StageMeta
                label={`${finalRoundActive ? "Final Round" : "Tourney"} · ${session.medium === "movie" ? "Movies" : "Games"} · ${remainingCount} left in this stack`}
                onChangeMode={goToModePick}
                onHome={goHome}
                onOpenSettings={() => setSettingsOpen(true)}
                compactMobile
              />
              <TourneyStage
                key={`${tourneyPair[0].id}-${tourneyPair[1].id}`}
                pair={tourneyPair}
                onPick={pickTourneyWinner}
                onWatchlist={addWatchTag}
                onToggleWatch={toggleWatchTag}
                watchedIds={session.watchTags.map((tag) => tag.titleId)}
                onReshufflePair={skipTourneyMatchup}
                onUndo={undoTourneyPick}
                undoCount={tourneyUndoCount}
                isFinalRound={finalRoundActive}
              />
              <TitleSearch
                medium={tourneyPair[0].medium}
                queuedIds={mediumQueue.map((item) => item.id)}
                onQueue={queueSearchedTitles}
              />
            </div>
          ) : null}

          {showEmpty && session.medium && session.playMode ? (
            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center">
              <EmptyCatalog
                medium={session.medium}
                playMode={session.playMode}
                leftoverTitle={leftoverTitle}
                isFinalRound={finalRoundActive}
                filterEmpty={eligibleCount === 0 && !finalRoundActive}
                poolError={poolStatus === "error" && eligibleCount === 0 ? poolError : null}
                poolSource={poolSource}
                onHome={goHome}
                onChangeMode={goToModePick}
                onReshuffle={reshuffleMedium}
                onUndo={undoTourneyPick}
                undoCount={tourneyUndoCount}
              />
              <TitleSearch
                medium={session.medium}
                queuedIds={mediumQueue.map((item) => item.id)}
                onQueue={queueSearchedTitles}
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

      <QueueModal
        open={queueOpen}
        onOpenChange={setQueueOpen}
        medium={session.medium}
        titles={mediumQueue}
        queueOnly={session.queueOnly}
        onQueue={queueSearchedTitles}
        onRemove={removeFromUserQueue}
        onQueueOnlyChange={setPresentQueuedOnly}
      />

      <Dialog open={tourneyHelpOpen} onOpenChange={setTourneyHelpOpen}>
        <DialogContent className="sm:max-w-lg" showCloseButton>
          <DialogHeader>
            <DialogTitle>{finalRoundActive ? "Final Round" : "Tourney"}</DialogTitle>
            <DialogDescription>
              {finalRoundActive
                ? `${session.medium === "movie" ? "Movies" : "Games"} · ${remainingCount} left. Vote among logged Contenders until one champion remains. Losers still go to Discard.`
                : `${session.medium === "movie" ? "Movies" : "Games"} · ${remainingCount} left in this stack.`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p>
              Select a Contender. Star adds an optional score. Bookmark adds Watch without voting.
              Drag a card onto WTF?? for a Wikipedia blurb — that does not count as a pick.
            </p>
            <p>
              Skip both titles without picking a winner and deal a new pair. They will not show up
              again right away. Back undoes the last Select, up to three times.
            </p>
            <p className="text-muted-foreground">
              Path settings stay available above the cards. Star and bookmark sit on each poster.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <ResultsLog
        open={printOpen}
        onOpenChange={setPrintOpen}
        responses={session.responses}
        discards={session.discards}
        watchTags={session.watchTags}
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
          watchTags={session.watchTags}
          caption="Rated titles, skips, the want list, Tourney discards, and Watch tags"
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
  compactMobile = false,
}: {
  label: string;
  onChangeMode: () => void;
  onHome: () => void;
  onOpenSettings: () => void;
  compactMobile?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <p className={compactMobile ? "hidden lg:block" : undefined}>{label}</p>
      <div className="flex flex-wrap gap-1">
        <Button type="button" variant="ghost" size="sm" onClick={onOpenSettings}>
          Path settings
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={compactMobile ? "hidden lg:inline-flex" : undefined}
          onClick={onChangeMode}
        >
          Ranx or Tourney
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={compactMobile ? "hidden lg:inline-flex" : undefined}
          onClick={onHome}
        >
          Switch catalog
        </Button>
      </div>
    </div>
  );
}
