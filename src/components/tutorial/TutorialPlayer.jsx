import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  X, ChevronLeft, ChevronRight, Pause, ListOrdered, Share2,
  Check, ArrowUpRight, SkipForward, Play, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import TutorialInterests from "@/components/tutorial/TutorialInterests";
import FloatingSlot from "@/components/floating/FloatingSlot";
import TutorialChapterMenu from "@/components/tutorial/TutorialChapterMenu";
import {
  getTutorialState, subscribeTutorial, loadTutorial, currentChapter, visibleChapters,
  flatPosition, visibleStepCount, nextStep, prevStep, skipChapter, skipAll,
  pauseTutorial, goToChapter, toggleInterest, setShowAll, startPicking,
  tutorialLink, resumeTutorial,
} from "@/lib/tutorial";

// Die Führung selbst. Sie liegt über der ganzen App, damit sie beim Springen
// auf eine Seite nicht abbricht — du kannst also lesen und gleichzeitig schauen.
export default function TutorialPlayer() {
  const navigate = useNavigate();
  const [state, setState] = useState(getTutorialState());
  const [menu, setMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadTutorial();
    return subscribeTutorial(setState);
  }, []);

  const chapter = currentChapter(state);
  const step = chapter.steps[state.stepIndex] || chapter.steps[0];

  const share = async () => {
    try {
      await navigator.clipboard.writeText(tutorialLink(chapter.id, state.stepIndex));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      /* Zwischenablage gesperrt */
    }
  };

  // Nur die kleine Erinnerung, wenn mitten drin pausiert wurde.
  if (!state.open) {
    if (state.finished || !state.done.length) return null;
    return (
      <FloatingSlot zone="bottom-right">
        <button
          onClick={resumeTutorial}
          className="pointer-events-auto inline-flex items-center gap-2 px-5 py-3 rounded-full glass-strong border-2 border-primary/40 text-[14px] font-bold text-foreground accent-glow"
        >
          <Play className="w-4 h-4 text-primary" />
          Tutorial fortsetzen · {chapter.title}
        </button>
      </FloatingSlot>
    );
  }

  return (
    <div className="fixed bottom-24 lg:bottom-6 right-4 z-[80] w-[min(92vw,460px)]">
      <div className="glass-strong rounded-3xl border-2 border-border max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3 border-b border-border">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-lg flex-shrink-0">{state.picking ? "✨" : chapter.icon}</span>
            <span className="min-w-0">
              <span className="block text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
                {state.picking ? "Interessen" : `Kapitel · ${chapter.title}`}
              </span>
              {!state.picking && (
                <span className="block text-[12px] font-semibold text-muted-foreground">
                  Schritt {state.stepIndex + 1} von {chapter.steps.length} · gesamt {flatPosition(state)}/{visibleStepCount(state)}
                </span>
              )}
            </span>
          </div>
          <button
            onClick={pauseTutorial}
            title="Pause — Stelle wird gemerkt"
            className="w-9 h-9 rounded-full bg-elevated text-muted-foreground flex items-center justify-center flex-shrink-0 hover:text-foreground transition-colors"
          >
            <Pause className="w-4 h-4" />
          </button>
        </div>

        {!state.picking && (
          <div className="h-1 bg-border">
            <div
              className="h-1 bg-primary transition-all"
              style={{ width: `${Math.round((flatPosition(state) / visibleStepCount(state)) * 100)}%` }}
            />
          </div>
        )}

        <div className="px-5 py-5">
          {state.picking ? (
            <TutorialInterests
              interests={state.interests}
              showAll={state.showAll}
              onToggle={toggleInterest}
              onShowAll={() => setShowAll(!state.showAll)}
              onStart={() => goToChapter(visibleChapters(state)[0].id)}
            />
          ) : menu ? (
            <TutorialChapterMenu
              state={state}
              onJump={(id) => { setMenu(false); goToChapter(id); }}
              onSkipChapter={(id) => { goToChapter(id); skipChapter(); }}
              onOpenInterests={() => { setMenu(false); startPicking(); }}
            />
          ) : (
            <div>
              <h3 className="font-display text-xl text-foreground text-gloss mb-2">{step.title}</h3>
              <p className="text-[15px] font-semibold text-muted-foreground leading-relaxed mb-4">{step.text}</p>

              {step.tips?.length > 0 && (
                <ul className="space-y-1.5 mb-4">
                  {step.tips.map((tip) => (
                    <li key={tip} className="flex items-start gap-2 text-[14px] font-semibold text-foreground">
                      <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-1" />
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              )}

              {step.to && (
                <button
                  onClick={() => navigate(step.to)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[14px] font-bold text-foreground mb-2"
                >
                  <ArrowUpRight className="w-4 h-4" /> Zeig mir das
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 px-5 pb-5">
          {state.picking ? (
            <button
              onClick={() => goToChapter(visibleChapters(state)[0].id)}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full glass-btn glass-btn-accent text-[14px] font-bold text-gloss"
            >
              <Sparkles className="w-4 h-4" /> Los geht's
            </button>
          ) : (
            <>
              <button
                onClick={prevStep}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[14px] font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Zurück
              </button>
              <button
                onClick={nextStep}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 rounded-full glass-btn glass-btn-accent text-[14px] font-bold text-gloss"
              >
                Weiter <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMenu((v) => !v)}
                className={cn(
                  "inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[14px] font-bold transition-colors",
                  menu ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <ListOrdered className="w-4 h-4" /> Kapitel
              </button>
              <button
                onClick={skipChapter}
                title="Dieses Kapitel überspringen"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[14px] font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                <SkipForward className="w-4 h-4" /> Überspringen
              </button>
              <button
                onClick={share}
                title="Link auf genau diese Stelle kopieren"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[14px] font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                <Share2 className="w-4 h-4" /> {copied ? "Kopiert" : "Teilen"}
              </button>
              <button
                onClick={skipAll}
                className="ml-auto inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[13px] font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                Alles beenden <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}