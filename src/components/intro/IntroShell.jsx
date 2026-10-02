import React from "react";
import { X, ArrowRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

// Das Fenster, in dem das Intro läuft: Fortschritt, Überspringen, Blättern.
export default function IntroShell({ step, total, onSkip, onBack, onNext, nextLabel = "Weiter", canBack = true, canNext = true, children }) {
  return (
    <div className="fixed inset-0 z-[98] flex items-center justify-center p-4 overflow-y-auto">
      <div className="fixed inset-0 bg-background/92 backdrop-blur-md" />
      <div
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{ background: "radial-gradient(circle at 50% 30%, rgba(226,149,120,0.18), transparent 60%)" }}
      />

      <div className="relative glass-strong rounded-3xl border-2 border-border w-full max-w-2xl my-auto">
        <div className="flex items-center justify-between gap-4 px-6 pt-5">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: total }).map((_, i) => (
              <span
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === step ? "w-7 bg-primary" : i < step ? "w-3 bg-primary/50" : "w-3 bg-border"
                )}
              />
            ))}
          </div>
          <button
            onClick={onSkip}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            Überspringen <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="px-6 py-6 min-h-[300px]">{children}</div>

        <div className="flex items-center justify-between gap-3 px-6 pb-6">
          <button
            onClick={onBack}
            disabled={!canBack || step === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] font-bold text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Zurück
          </button>
          <button
            onClick={onNext}
            disabled={!canNext}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full glass-btn glass-btn-accent text-[14px] font-bold text-gloss disabled:opacity-40"
          >
            {nextLabel} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}