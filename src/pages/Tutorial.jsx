import React, { useEffect, useState } from "react";
import { Play, RotateCcw, Share2, Check, ArrowUpRight, SkipForward, Sparkles, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CHAPTERS, visibleChapters, getTutorialState, subscribeTutorial, loadTutorial,
  openTutorial, resetTutorial, startPicking, setShowAll, toggleInterest, setInterests,
  tutorialLink, visibleStepCount, flatPosition, currentChapter,
} from "@/lib/tutorial";
import TutorialInterests from "@/components/tutorial/TutorialInterests";

// Die Übersichtsseite: hier fängst du an, hier machst du weiter, hier teilst du
// einzelne Kapitel. Der Link oben führt direkt an die Stelle, die du meinst.
export default function Tutorial() {
  const [state, setState] = useState(getTutorialState());
  const [copied, setCopied] = useState("");
  const [showInterests, setShowInterests] = useState(false);

  useEffect(() => {
    loadTutorial().then((loaded) => {
      const params = new URLSearchParams(window.location.search);
      const chapterId = params.get("chapter");
      if (!chapterId) return;
      const step = Number(params.get("step") || 0);
      openTutorial({ chapterId, step: Number.isFinite(step) ? step : 0 });
      window.history.replaceState({}, "", "/tutorial");
      setState(getTutorialState());
      void loaded;
    });
    return subscribeTutorial(setState);
  }, []);

  const chapters = visibleChapters(state);
  const chapter = currentChapter(state);
  const started = state.done.length > 0;
  const percent = Math.round((flatPosition(state) / Math.max(1, visibleStepCount(state))) * 100);

  const copy = async (link, key) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(key);
      setTimeout(() => setCopied(""), 2000);
    } catch (e) {
      /* Zwischenablage gesperrt */
    }
  };

  return (
    <div className="w-full px-4 lg:px-10 py-8">
      <div className="glass-strong rounded-3xl border-2 border-border p-6 lg:p-8 mb-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-2">Die Führung</p>
        <h1 className="font-display text-4xl lg:text-5xl text-foreground text-gloss mb-3">
          Alles, was hier geht
        </h1>
        <p className="text-[16px] font-semibold text-muted-foreground max-w-3xl leading-relaxed mb-5">
          {CHAPTERS.length} Kapitel, Schritt für Schritt — wo was ist, wie es läuft und was du damit
          machen kannst. Du kannst jederzeit pausieren und genau da weitermachen, wo du warst. Jedes
          Kapitel kannst du anspringen oder überspringen, und du bestimmst vorher, was dich überhaupt
          interessiert. Jede Stelle hat einen eigenen Link — den kannst du weitergeben.
        </p>

        {started && (
          <div className="mb-5">
            <div className="flex items-center justify-between text-[13px] font-bold text-muted-foreground mb-1.5">
              <span>
                {state.finished ? "Durch — du kennst die Plattform." : `Zuletzt: ${chapter.title}`}
              </span>
              <span>{percent} %</span>
            </div>
            <div className="h-2 rounded-full bg-border overflow-hidden">
              <div className="h-2 bg-primary transition-all" style={{ width: `${percent}%` }} />
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => openTutorial({})}
            className="inline-flex items-center gap-2 px-7 py-3 rounded-full glass-btn glass-btn-accent text-[15px] font-bold text-gloss"
          >
            <Play className="w-4 h-4" /> {started && !state.finished ? "Weitermachen" : started ? "Nochmal ansehen" : "Tutorial starten"}
          </button>
          <button
            onClick={() => { setShowInterests((v) => !v); }}
            className={cn(
              "inline-flex items-center gap-2 px-6 py-3 rounded-full text-[15px] font-bold transition-colors border-2",
              showInterests ? "border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <Sparkles className="w-4 h-4" /> Was mich interessiert
          </button>
          <button
            onClick={() => copy(tutorialLink(), "all")}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[15px] font-bold text-muted-foreground hover:text-foreground transition-colors border-2 border-border"
          >
            {copied === "all" ? <Check className="w-4 h-4 text-primary" /> : <Share2 className="w-4 h-4" />}
            {copied === "all" ? "Link kopiert" : "Tutorial teilen"}
          </button>
          <button
            onClick={() => startPicking()}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[15px] font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            Im Fenster starten
          </button>
          {started && (
            <button
              onClick={resetTutorial}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[15px] font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              <RotateCcw className="w-4 h-4" /> Zurücksetzen
            </button>
          )}
        </div>

        {state.interests.length > 0 && (
          <p className="text-[14px] font-semibold text-muted-foreground mt-4">
            Deine Interessen: {state.interests.join(", ")} — nur passende Kapitel werden gezeigt.{" "}
            <button onClick={() => setInterests([])} className="text-primary font-bold">
              alles zeigen
            </button>
          </p>
        )}
      </div>

      {showInterests && (
        <div className="glass rounded-2xl border-2 border-border p-6 mb-6">
          <TutorialInterests
            interests={state.interests}
            showAll={state.showAll}
            onToggle={toggleInterest}
            onShowAll={() => setShowAll(!state.showAll)}
            onStart={() => { setShowInterests(false); openTutorial({ chapterId: chapters[0].id }); }}
          />
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {chapters.map((c) => {
          const done = c.steps.length;
          const finishedSteps = c.steps.filter((_, i) => state.done.includes(`${c.id}:${i}`)).length;
          const complete = finishedSteps === done;
          const skipped = state.skipped.includes(c.id);
          return (
            <div key={c.id} className="glass rounded-2xl border-2 border-border p-5 flex flex-col">
              <div className="flex items-start justify-between gap-3 mb-2">
                <span className="text-2xl">{c.icon}</span>
                {complete ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-600/20 text-emerald-400 text-[11px] font-bold uppercase">
                    <Check className="w-3 h-3" /> fertig
                  </span>
                ) : skipped ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-elevated text-muted-foreground text-[11px] font-bold uppercase">
                    <SkipForward className="w-3 h-3" /> übersprungen
                  </span>
                ) : (
                  <span className="px-2.5 py-1 rounded-full bg-elevated text-muted-foreground text-[11px] font-bold uppercase">
                    {c.steps.length} Schritte
                  </span>
                )}
              </div>
              <p className="font-display text-xl text-foreground mb-1">{c.title}</p>
              <p className="text-[14px] font-semibold text-muted-foreground mb-4 flex-1">{c.subtitle}</p>

              {finishedSteps > 0 && !complete && (
                <div className="h-1.5 rounded-full bg-border overflow-hidden mb-3">
                  <div className="h-1.5 bg-primary" style={{ width: `${(finishedSteps / done) * 100}%` }} />
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => openTutorial({ chapterId: c.id })}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full glass-btn text-[13px] font-bold text-foreground"
                >
                  <ArrowUpRight className="w-3.5 h-3.5" /> {complete ? "Nochmal" : "Ansehen"}
                </button>
                <button
                  onClick={() => copy(tutorialLink(c.id), c.id)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold text-muted-foreground hover:text-foreground transition-colors"
                >
                  {copied === c.id ? <Check className="w-3.5 h-3.5 text-primary" /> : <Link2 className="w-3.5 h-3.5" />}
                  {copied === c.id ? "Kopiert" : "Link"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}