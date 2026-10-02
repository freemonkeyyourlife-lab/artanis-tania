import React from "react";
import { Plus, X, MessageSquareQuote } from "lucide-react";
import { Input } from "@/components/ui/input";
import OwnerSwitch from "@/components/owner/OwnerSwitch";
import OptionListEditor from "@/components/owner/OptionListEditor";
import GreetingEditor from "@/components/owner/GreetingEditor";
import { DEFAULT_INTRO_STEPS, DEFAULT_INTERESTS } from "@/lib/onboarding";

// Die Schalter und Texte für die Begrüßung und die Erklärungen.
export default function StructureEditor({ value, onChange }) {
  const steps = value.introSteps || [];
  const interests = value.interestOptions || [];

  const set = (patch) => onChange({ ...value, ...patch });

  const setStep = (i, patch) =>
    set({ introSteps: steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)) });

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <OwnerSwitch
          on={value.introEnabled !== false}
          onToggle={() => set({ introEnabled: value.introEnabled === false })}
          label="Begrüßung beim ersten Besuch"
          hint="Jeder Neue bekommt am Anfang die Erklärung — überspringen kann er immer."
        />
        <OwnerSwitch
          on={value.infoEnabled !== false}
          onToggle={() => set({ infoEnabled: value.infoEnabled === false })}
          label="Info-Knöpfe überall"
          hint="Das kleine i an den Bereichen. Jeder kann es für sich oben in der Kopfzeile aus- und einschalten."
        />
      </div>

      <GreetingEditor value={value} onChange={onChange} />

      <OptionListEditor
        title="Was interessiert dich? — die Auswahl"
        hint="Diese Begriffe bekommt der Gast am Ende der Begrüßung angeboten. Was er wählt, landet bei ihm im Profil."
        options={interests}
        onChange={(interestOptions) => set({ interestOptions })}
        defaults={DEFAULT_INTERESTS}
      />

      <div className="rounded-2xl border-2 border-border p-4">
        <div className="flex items-center gap-2 mb-1">
          <MessageSquareQuote className="w-4 h-4 text-primary" />
          <p className="font-display text-lg text-foreground">Die Einweisung</p>
        </div>
        <p className="text-[13px] font-semibold text-muted-foreground mb-4">
          Jeder Block ist eine Seite — sie kommen direkt nach der Begrüßung. Titel kurz, Text in einfachen Worten.
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