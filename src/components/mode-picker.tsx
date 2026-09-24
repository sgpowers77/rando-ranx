"use client";

import { PathSettings } from "@/components/path-settings";
import { ExperienceModal } from "@/components/experience-modal";
import { TourneyStyleModal } from "@/components/tourney-style-modal";
import { Button } from "@/components/ui/button";
import { defaultFilters } from "@/lib/filters";
import { setExperienceHidden, experienceHidden } from "@/lib/tourney-experience";
import type { Medium, PathFilters, PlayMode, TourneyStyle } from "@/lib/types";
import { catalogLabel, catalogNoun } from "@/lib/medium";
import { Dices, ListOrdered } from "lucide-react";
import { useRef, useState } from "react";

type ModePickerProps = {
  medium: Medium;
  filters: PathFilters;
  fullRando: boolean;
  onChoose: (mode: PlayMode, tourneyStyle?: TourneyStyle) => void;
  onSaveFilters: (filters: PathFilters) => void;
  onFullRandoChange: (on: boolean) => void;
  onBack: () => void;
  showRatings?: boolean;
};

export function ModePicker({
  medium,
  filters,
  fullRando,
  onChoose,
  onSaveFilters,
  onFullRandoChange,
  onBack,
  showRatings = false,
}: ModePickerProps) {
  const catalog = catalogNoun(medium);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [step, setStep] = useState<"idle" | "experience" | "style">("idle");
  const [pendingMode, setPendingMode] = useState<PlayMode | null>(null);
  const proceedRef = useRef<PlayMode | null>(null);

  const finish = (mode: PlayMode, style?: TourneyStyle) => {
    proceedRef.current = null;
    setPendingMode(null);
    setStep("idle");
    onChoose(mode, style);
  };

  const openStyle = () => {
    setPendingMode("tourney");
    setStep("style");
  };

  const afterExperience = (mode: PlayMode) => {
    if (mode === "tourney") {
      window.setTimeout(() => openStyle(), 50);
      return;
    }
    finish("rank");
  };

  const takeProceed = () => {
    const mode = proceedRef.current;
    proceedRef.current = null;
    return mode;
  };

  const beginMode = (mode: PlayMode) => {
    setPendingMode(mode);
    if (experienceHidden()) {
      afterExperience(mode);
      return;
    }
    setStep("experience");
  };

  return (
    <section className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 px-4 py-10 sm:px-6">
      <div>
        <p className="text-sm font-medium tracking-wide text-primary uppercase">
          {catalogLabel(medium)}
        </p>
        <h1 className="mt-2 max-w-xl font-heading text-4xl leading-tight tracking-tight text-balance sm:text-5xl">
          Ranx one at a time, or run a Tourney.
        </h1>
        <p className="mt-4 max-w-lg text-base text-muted-foreground sm:text-lg">
          Ranx deals a single {catalog.slice(0, -1)}. Tourney deals two titles: VS Mode (Select a
          Contender) or Like Mode (thumb up / thumb down). After you pick a mode, Wikipedia search
          can Queue titles you choose — never as an automated deal.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Button type="button" onClick={() => beginMode("tourney")} className="h-14 w-full gap-2 text-base">
          <Dices className="size-5" />
          Tourney
        </Button>
        <Button type="button" onClick={() => beginMode("rank")} className="h-14 w-full gap-2 text-base">
          <ListOrdered className="size-5" />
          Ranx
        </Button>
      </div>
      <Button type="button" variant="ghost" className="self-start" onClick={onBack}>
        Back to catalog pick
      </Button>
      <PathSettings
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        medium={medium}
        filters={filters ?? defaultFilters(medium)}
        onSave={onSaveFilters}
        showRatings={showRatings}
      />
      <ExperienceModal
        open={step === "experience"}
        medium={medium}
        fullRando={fullRando}
        onOpenChange={(open) => {
          if (open) return;
          if (settingsOpen) return;
          const mode = takeProceed();
          if (mode) {
            afterExperience(mode);
            return;
          }
          setStep("idle");
          setPendingMode(null);
        }}
        onOpenFilters={() => setSettingsOpen(true)}
        onApplyFilters={onSaveFilters}
        onFullRandoChange={onFullRandoChange}
        onContinue={(hideNextTime) => {
          setExperienceHidden(hideNextTime);
          const mode = pendingMode;
          proceedRef.current = mode;
          setStep("idle");
          window.setTimeout(() => {
            const next = takeProceed();
            if (next) afterExperience(next);
          }, 80);
        }}
      />
      <TourneyStyleModal
        open={step === "style"}
        onOpenChange={(open) => {
          if (!open) {
            setStep("idle");
            setPendingMode(null);
          }
        }}
        onChoose={(style) => finish("tourney", style)}
      />
    </section>
  );
}
