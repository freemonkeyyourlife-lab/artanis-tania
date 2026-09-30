import React, { useState } from "react";
import { Plus, X, Eye, MessageSquareQuote } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DEFAULT_INTRO_STEPS, DEFAULT_INTERESTS, openIntroPreview } from "@/lib/onboarding";

const Switch = ({ on, onToggle, label, hint }) => (
  <button
    onClick={onToggle}
    className="w-full flex items-center gap-4 rounded-2xl border-2 border-border p-4 text-left hover:border-primary/50 transition-colors"
  >
    <span
      className={`w-12 h-7 rounded-full flex-shrink-0 p-1 transition-colors ${on ? "bg-primary" : "bg-border"}`}
    >
      <span
        className={`block w-5 h-5 rounded-full bg-background transition-transform ${on ? "translate-x-5" : ""}`}
      />
    </span>
    <span className="flex-1 min-w-0">
      <span className="block text-[15px] font-bold text-foreground">{label}</span>
      <span className="block text-[13px] font-semibold text-muted-foreground">{hint}</span>
    </span>
    <span className={`text-[12px] font-bold uppercase tracking-wider ${on ? "text-primary" : "text-muted-foreground"}`}>
      {on ? "An" : "Aus"}
    </span>
  </button>
);

// Die Schalter und Texte für die Begrüßung und die Erklärungen.
export default function StructureEditor({ value, onChange }) {
  const [newInterest, setNewInterest] = useState("");
  const steps = value.introSteps || [];
  const interests = value.interestOptions || [];

  const set = (patch) => onChange({ ...value, ...patch });

  const setStep = (i, patch) =>
    set({ introSteps: steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) });

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Switch
          on={value.introEnabled !== false}
          onToggle={() => set({ introEnabled: value.introEnabled === false })}
          label="Begrüßung beim ersten Besuch"
          hint="Jeder Neue bekommt am Anfang die Erklärung — überspringen kann er immer."
        />
        <Switch
          on={value.infoEnabled !== false}
          onToggle={() => set({ infoEnabled: value.infoEnabled === false })}
          label="Info-Knöpfe überall"
          hint="Das kleine i an den Bereichen. Jeder kann es für sich oben in der Kopfzeile aus- und einschalten."
        />
        <button
          onClick={openIntroPreview}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full glass-btn text-[15px] font-bold text-foreground"
        >
          <Eye className="w-4 h-4" /> Begrüßung ansehen
        </button>
      </div>

      <div className="rounded-2xl border-2 border-border p-4">
        <p className="font-display text-lg text-foreground mb-1">Was interessiert dich? — die Auswahl</p>
        <p className="text-[13px] font-semibold text-muted-foreground mb-4">
          Diese Begriffe bekommt der Gast am Ende der Begrüßung angeboten. Was er wählt, landet bei ihm im Profil.
        </p>
        <div className="flex flex-wrap gap-2 mb-3">
          {interests.map((item, i) => (
            <span
              key={`${item}-${i}`}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-elevated border border-border text-[13px] font-bold text-foreground"
            >
              {item}
              <button
                onClick={() => set({ interestOptions: interests.filter((_, idx) => idx !== i) })}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
          {interests.length === 0 && (
            <p className="text-[13px] font-semibold text-muted-foreground">Noch keine — dann gelten die Standardbegriffe.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Input
            value={newInterest}
            onChange={(e) => setNewInterest(e.target.value)}
            placeholder="Neuer Begriff"
            className="flex-1 min-w-[200px] h-11 text-[15px] font-semibold"
          />
          <button
            onClick={() => {
              if (!newInterest.trim()) return;
              set({ interestOptions: [...interests, newInterest.trim()] });
              setNewInterest("");
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[14px] font-bold text-foreground"
          >
            <Plus className="w-4 h-4" /> Dazulegen
          </button>
          <button
            onClick={() => set({ interestOptions: DEFAULT_INTERESTS })}
            className="px-5 py-2.5 rounded-full text-[14px] font-bold text-muted-foreground hover:text-foreground"
          >
            Zurücksetzen
          </button>
        </div>
      </div>

      <div className="rounded-2xl border-2 border-border p-4">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquareQuote className="w-4 h-4 text-primary" />
          <p className="font-display text-lg text-foreground">Die Begrüßung selbst</p>
        </div>
        <p className="text-[13px] font-semibold text-muted-foreground mb-4">
          Jeder Block ist eine Seite. Titel kurz, Text in einfachen Worten.
        </p>
        <div className="space-y-4">
          {steps.map((s, i) => (
            <div key={i} className="rounded-xl border border-border p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-elevated border border-border text-[11px] font-bold flex items-center justify-center text-foreground flex-shrink-0">
                  {i + 1}
                </span>
                <Input
                  value={s.title || ""}
                  onChange={(e) => setStep(i, { title: e.target.value })}
                  placeholder="Überschrift"
                  className="flex-1 h-10 text-[15px] font-bold"
                />
                <button
                  onClick={() => set({ introSteps: steps.filter((_, idx) => idx !== i) })}
                  className="w-9 h-9 rounded-full flex items-center justify-center text-muted-foreground hover:text-destructive"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <textarea
                value={s.text || ""}
                onChange={(e) => setStep(i, { text: e.target.value })}
                rows={3}
                placeholder="Was du dazu sagst"
                className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-[14px] font-semibold text-foreground resize-none focus:outline-none focus:border-primary"
              />
            </div>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={() => set({ introSteps: [...steps, { title: "", text: "" }] })}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[14px] font-bold text-foreground"
          >
            <Plus className="w-4 h-4" /> Block dazulegen
          </button>
          <button
            onClick={() => set({ introSteps: DEFAULT_INTRO_STEPS })}
            className="px-5 py-2.5 rounded-full text-[14px] font-bold text-muted-foreground hover:text-foreground"
          >
            Zurücksetzen
          </button>
        </div>
      </div>
    </div>
  );
}