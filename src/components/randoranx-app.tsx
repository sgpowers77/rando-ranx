"use client";

import { AppHeader } from "@/components/app-header";
import { EmptyCatalog } from "@/components/empty-catalog";
import { EntryEditor } from "@/components/entry-editor";
import { Landing } from "@/components/landing";
import { ModePicker } from "@/components/mode-picker";
import { ResultsTable } from "@/components/results-log";
import { SessionLog } from "@/components/session-log";
import { TitleStage } from "@/components/title-stage";
import { TourneyStage } from "@/components/tourney-stage";
import { PathSettings } from "@/components/path-settings";
import { QueueModal } from "@/components/queue-modal";
import { TitleSearch } from "@/components/title-search";
import { AppSettingsMenu } from "@/components/app-settings";
import { Button } from "@/components/ui/button";
import { SlidersHorizontal } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { defaultFilters } from "@/lib/filters";
import { logsForMedium, queuedForMedium } from "@/lib/session";
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
    returnHomeFromPlay,
    goToModePick,
    recordAndAdvance,
    pickTourneyWinner,
    savePathFilters,
    setRandomizeFilters,
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
  const [mobileLogOpen, setMobileLogOpen] = useState(false);
  const [queueOpen, setQueueOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [tourneyHelpOpen, setTourneyHelpOpen] = useState(false);
  const [returnHomeOpen, setReturnHomeOpen] = useState(false);

  const logs = logsForMedium(session, session.medium);
  const movieLogs = logsForMedium(session, "movie");
  const movieQueue = queuedForMedium(session, "movie");
  const mediumQueue = logs.userQueue;
  const showQueueIcon = Boolean(session.medium) && mediumQueue.length > 0;

  const editingEntry = useMemo(
    () => logs.responses.find((entry) => entry.id === editingId) ?? null,
    [editingId, logs.responses]
  );

  const selectEntry = (id: string) => {
    setEditingId(id);
    setMobileLogOpen(false);
  };

  const stopEditing = () => setEditingId(null);

  const log = (
    <SessionLog
      responses={logs.responses}
      discards={logs.discards}
      watchTags={logs.watchTags}
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
      medium={session.medium}
      queueCount={mediumQueue.length}
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
    <div className="flex min-h-dvh flex-col">
      <AppHeader
        onHome={() => {
          stopEditing();
          goHome();
        }}
        settings={
          <AppSettingsMenu
            responses={logs.responses}
            discards={logs.discards}
            watchTags={logs.watchTags}
            resultCount={logs.responses.length + logs.discards.length}
            movieResponses={movieLogs.responses}
            movieWatchTags={movieLogs.watchTags}
            movieQueue={movieQueue}
            catalogTitles={[...(session.liveTitles ?? []), ...(session.customTitles ?? [])]}
            onResetAll={() => {
              clearSession();
              setEditingId(null);
            }}
          />
        }
        onOpenMobileLog={() => setMobileLogOpen(true)}
        onOpenTourneyHelp={() => setTourneyHelpOpen(true)}
        resultCount={logs.responses.length + logs.discards.length}
        showHome={session.medium !== null || editingEntry !== null}
        showTourneyHelp={Boolean(showTourney)}
      />

      <div className="flex min-h-[calc(100dvh-4rem)] flex-1">
        <aside className="no-print sticky top-16 hidden h-[calc(100dvh-4rem)] w-80 shrink-0 self-start overflow-hidden border-r border-border/70 bg-card/40 lg:flex lg:flex-col">
          {log}
        </aside>

        <main className={`no-print mx-auto flex min-h-[calc(100dvh-4rem)] w-full max-w-3xl flex-1 flex-col px-4 sm:px-6 ${showTourney ? "py-3 lg:py-8" : "py-8"}`}>
          {status === "loading" ? (
            <div className="flex flex-1 flex-col justify-center" role="status" aria-live="polite">
              <p className="text-sm font-medium tracking-wide text-primary uppercase">
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

          {showLanding ? <Landing onChoose={chooseMedium} /> : null}

          {showModePick && session.medium ? (
            <ModePicker
              medium={session.medium}
              filters={session.pathFilters[session.medium] ?? defaultFilters(session.medium)}
              fullRando={session.randomizeFilters?.[session.medium] === true}
              onChoose={choosePlayMode}
              onSaveFilters={(next) => {
                if (!session.medium) return;
                savePathFilters(session.medium, next);
              }}
              onFullRandoChange={(on) => {
                if (!session.medium) return;
                setRandomizeFilters(session.medium, on);
              }}
              onBack={goHome}
            />
          ) : null}

          {showPoolLoading ? (
            <div className="flex flex-1 flex-col justify-center" role="status" aria-live="polite">
              <p className="text-sm font-medium tracking-wide text-primary uppercase">
                Live catalog
              </p>
              <h1 className="mt-2 font-heading text-3xl">
                {session.medium === "movie"
                  ? "Sampling The Movies Dataset…"
                  : "Sampling OpenGameDB + GameDex…"}
              </h1>
              <p className="mt-2 text-muted-foreground">
                {session.medium === "movie"
                  ? "Dealing films from movies_metadata.csv using release date, genres, and vote/popularity. Wikipedia stays on search and WTF blurbs."
                  : "Dealing games from the baked OpenGameDB and GameDex index using year, genre, platform, and obscurity."}
              </p>
            </div>
          ) : null}
          {showRank && currentTitle ? (
            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-4">
              <StageMeta
                label={`Ranx · ${session.medium === "movie" ? "Movies" : "Games"} · ${remainingCount} in this deal${
                  poolSource === "dataset"
                    ? session.medium === "movie"
                      ? " · Movies Dataset"
                      : " · OpenGameDB + GameDex"
                    : ""
                }`}
                onChangeMode={goToModePick}
                onHome={goHome}
              />
              <TitleStage
                key={currentTitle.id}
                title={currentTitle}
                watched={logs.watchTags.some((tag) => tag.titleId === currentTitle.id)}
                onToggleWatch={() => toggleWatchTag(currentTitle)}
                onWatchlist={addWatchTag}
                onRated={(rating, comments, watchedDate) =>
                  recordAndAdvance("rated", { rating, comments, watchedDate })
                }
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
                compactMobile
              />
              <TourneyStage
                key={`${tourneyPair[0].id}-${tourneyPair[1].id}`}
                pair={tourneyPair}
                onPick={pickTourneyWinner}
                onWatchlist={addWatchTag}
                onToggleWatch={toggleWatchTag}
                watchedIds={logs.watchTags.map((tag) => tag.titleId)}
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
            <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-4">
              <StageMeta
                label={`${session.playMode === "tourney" ? (finalRoundActive ? "Final Round" : "Tourney") : "Ranx"} · ${session.medium === "movie" ? "Movies" : "Games"}`}
                onChangeMode={goToModePick}
                onHome={goHome}
                onOpenSettings={() => setFiltersOpen(true)}
                showFilters
              />
              <EmptyCatalog
                medium={session.medium}
                playMode={session.playMode}
                leftoverTitle={leftoverTitle}
                isFinalRound={finalRoundActive}
                filterEmpty={eligibleCount === 0 && !finalRoundActive}
                poolError={poolStatus === "error" && eligibleCount === 0 ? poolError : null}
                poolSource={poolSource}
                canFinalRound={contenderCount >= 2}
                contenderCount={contenderCount}
                onHome={goHome}
                onChangeMode={goToModePick}
                onReshuffle={reshuffleMedium}
                onFinalRound={() => {
                  stopEditing();
                  beginFinalRound();
                }}
                onReturnHome={() => setReturnHomeOpen(true)}
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
        <SheetContent side="left" className="flex h-dvh max-h-dvh w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-sm" showCloseButton>
          <SheetHeader className="sr-only">
            <SheetTitle>Session log</SheetTitle>
          </SheetHeader>
          {log}
        </SheetContent>
      </Sheet>

      {session.medium && session.playMode ? (
        <PathSettings
          open={filtersOpen}
          onOpenChange={setFiltersOpen}
          medium={session.medium}
          filters={session.pathFilters[session.medium] ?? defaultFilters(session.medium)}
          onSave={(next) => {
            if (!session.medium) return;
            savePathFilters(session.medium, next);
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
              Skip both titles without picking a winner. Two new titles that match your filters join
              the stack; this pair will not show up again right away. Skip does not shrink the stack.
              Undo undoes the last Select, up to three times.
            </p>
            <p className="text-muted-foreground">
              Star and bookmark sit on each poster. Change the filter mix from Choose an Experience
              (presets, Filters, or Full Rando) before a deal starts.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={returnHomeOpen} onOpenChange={setReturnHomeOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Return Home?</AlertDialogTitle>
            <AlertDialogDescription>
              {session.medium === "game" ? "The Games" : "The Movies"}{" "}
              {session.playMode === "rank" ? "Ranx" : "Tourney"} log will be cleared: Contenders,
              skips, wants, and Discard for this catalog only. Watch, ratings, review comments, and
              notes stay.{" "}
              {session.medium === "game" ? "Movies" : "Games"} logs are not touched.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Stay here</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                returnHomeFromPlay();
                setReturnHomeOpen(false);
                setEditingId(null);
              }}
            >
              Return Home
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <section className="print-only hidden p-6 text-black print:block">
        <h1 className="mb-1 text-2xl font-semibold">RandoRanx results</h1>
        <p className="mb-6 text-sm">
          {session.medium === "game"
            ? "Games session log printed from this browser."
            : session.medium === "movie"
              ? "Movies session log printed from this browser."
              : "Session log printed from this browser."}
        </p>
        <ResultsTable
          responses={logs.responses}
          discards={logs.discards}
          watchTags={logs.watchTags}
          caption={
            session.medium === "game"
              ? "Games — rated titles, skips, the want list, Tourney discards, and Watch tags"
              : session.medium === "movie"
                ? "Movies — rated titles, skips, the want list, Tourney discards, and Watch tags"
                : "Pick Movies or Games to print that catalog’s log"
          }
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
  showFilters = false,
  compactMobile = false,
}: {
  label: string;
  onChangeMode: () => void;
  onHome: () => void;
  onOpenSettings?: () => void;
  showFilters?: boolean;
  compactMobile?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <p className={compactMobile ? "hidden lg:block" : undefined}>{label}</p>
      <div className="flex flex-wrap items-center gap-1">
        {showFilters && onOpenSettings ? (
          <Button type="button" variant="ghost" size="sm" className="gap-1.5" aria-label="Filters" onClick={onOpenSettings}>
            <SlidersHorizontal className="size-4" />
            Filters
          </Button>
        ) : null}
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
