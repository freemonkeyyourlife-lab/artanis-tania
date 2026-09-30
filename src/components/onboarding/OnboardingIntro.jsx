import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { X, ArrowRight, ArrowLeft, Check, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import VoiceInput from "@/components/VoiceInput";
import {
  loadStructure,
  getStructure,
  subscribeStructure,
  START_PATHS,
  saveIntroProfile,
  introSeen,
  markIntroSeen,
} from "@/lib/onboarding";

// Die Begrüßung beim ersten Besuch. Sie erklärt, was hier los ist, fragt nach
// Interessen und schickt den Gast an die richtige Stelle. Überspringen geht immer.
export default function OnboardingIntro() {
  const navigate = useNavigate();
  const [structure, setStructure] = useState(getStructure());
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [interests, setInterests] = useState([]);
  const [path, setPath] = useState("");
  const [wish, setWish] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadStructure().then((s) => {
      setStructure(s);
      if (s.introEnabled && !introSeen()) setVisible(true);
    });
    return subscribeStructure(setStructure);
  }, []);

  // Damit du die Begrüßung aus der Konsole heraus jederzeit ansehen kannst.
  useEffect(() => {
    const open = () => {
      setStep(0);
      setVisible(true);
    };
    window.addEventListener("artanis:intro-preview", open);
    return () => window.removeEventListener("artanis:intro-preview", open);
  }, []);

  const steps = structure.introSteps || [];
  const total = steps.length + 2;
  const isLast = step === total - 1;

  const finish = async (goTo) => {
    if (busy) return;
    setBusy(true);
    markIntroSeen();
    const chosen = START_PATHS.find((p) => p.id === path);
    if (interests.length || wish || chosen) {
      await saveIntroProfile({ interests, path: chosen?.label || "", wish });
    }
    setVisible(false);
    setBusy(false);
    if (goTo || chosen?.to) navigate(goTo || chosen.to);
  };

  const skip = () => finish(null);

  const toggleInterest = (item) =>
    setInterests((list) => (list.includes(item) ? list.filter((i) => i !== item) : [...list, item]));

  if (!visible) return null;

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
            onClick={skip}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            Überspringen <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="px-6 py-6 min-h-[300px]">
          {step < steps.length && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-3">
                Schritt {step + 1} von {steps.length}
              </p>
              <h2 className="font-display text-3xl lg:text-4xl text-foreground text-gloss mb-4">
                {steps[step].title}
              </h2>
              <p className="text-[16px] font-semibold text-muted-foreground leading-relaxed max-w-xl">
                {steps[step].text}
              </p>
            </div>
          )}

          {step === steps.length && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-3">Kurz zu dir</p>
              <h2 className="font-display text-3xl lg:text-4xl text-foreground text-gloss mb-3">
                Was interessiert dich?
              </h2>
              <p className="text-[15px] font-semibold text-muted-foreground mb-5">
                Such dir aus, was passt — gern mehrere. Das merken wir uns, damit du nicht bei null anfängst.
              </p>
              <div className="flex flex-wrap gap-2">
                {(structure.interestOptions || []).map((item) => {
                  const on = interests.includes(item);
                  return (
                    <button
                      key={item}
                      onClick={() => toggleInterest(item)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[14px] font-bold transition-colors border-2",
                        on
                          ? "glass-btn glass-btn-accent border-transparent text-gloss"
                          : "border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {on && <Check className="w-3.5 h-3.5" />}
                      {item}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {isLast && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-3">Los geht's</p>
              <h2 className="font-display text-3xl lg:text-4xl text-foreground text-gloss mb-5">
                Wo willst du anfangen?
              </h2>
              <div className="grid gap-3 sm:grid-cols-3 mb-6">
                {START_PATHS.map((p) => {
                  const on = path === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => setPath(on ? "" : p.id)}
                      className={cn(
                        "text-left rounded-2xl border-2 p-4 transition-colors",
                        on ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                      )}
                    >
                      <p className="font-display text-[16px] text-foreground">{p.label}</p>
                      <p className="text-[13px] font-semibold text-muted-foreground mt-1">{p.hint}</p>
                    </button>
                  );
                })}
              </div>

              <p className="text-[15px] font-bold text-foreground mb-2">
                Oder sag einfach in einem Satz, was du willst:
              </p>
              <div className="flex items-start gap-2">
                <textarea
                  value={wish}
                  onChange={(e) => setWish(e.target.value)}
                  rows={2}
                  placeholder="Zum Beispiel: Ich will mit Triania reden und dabei zuschauen, wie sie sich verhält."
                  className="flex-1 rounded-2xl border-2 border-input bg-transparent px-4 py-3 text-[15px] font-semibold text-foreground resize-none focus:outline-none focus:border-primary"
                />
                <VoiceInput onResult={(text) => setWish((w) => (w ? `${w} ${text}` : text))} className="w-12 h-12" />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-6 pb-6">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full text-[14px] font-bold text-muted-foreground hover:text-foreground disabled:opacity-0 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Zurück
          </button>

          {isLast ? (
            <button
              onClick={() => finish(null)}
              disabled={busy}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full glass-btn glass-btn-accent text-[15px] font-bold text-gloss disabled:opacity-50"
            >
              <Check className="w-4 h-4" /> Fertig
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full glass-btn glass-btn-accent text-[15px] font-bold text-gloss"
            >
              Weiter <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}