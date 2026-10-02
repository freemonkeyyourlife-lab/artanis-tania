import React from "react";
import { Eye, Heart, Volume2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import OwnerSwitch from "@/components/owner/OwnerSwitch";
import OptionListEditor from "@/components/owner/OptionListEditor";
import { BASE_VOICES } from "@/lib/voiceDj";
import {
  DEFAULT_GENDERS,
  DEFAULT_ORIENTATIONS,
  DEFAULT_GREETING,
  DEFAULT_GUIDE_BEHAVIOR,
  openIntroPreview,
} from "@/lib/onboarding";

const area =
  "w-full rounded-xl border border-input bg-transparent px-3 py-2 text-[14px] font-semibold text-foreground resize-none focus:outline-none focus:border-primary";

// Der Anfang: die zwei Fragen, die Begrüßung durch die Erzählerinnen und wie
// sie sich insgesamt benimmt — Verhalten, Sprache, Wortwahl.
export default function GreetingEditor({ value, onChange }) {
  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border-2 border-primary/40 p-4">
        <div className="flex items-center gap-2 mb-1">
          <Heart className="w-4 h-4 text-primary" />
          <p className="font-display text-lg text-foreground">Ganz am Anfang: wer bist du, worauf stehst du?</p>
        </div>
        <p className="text-[13px] font-semibold text-muted-foreground mb-4">
          Diese zwei Fragen stehen vor allem anderen. Danach richten sich Ansprache und Richtung — du kannst jede
          einzeln abschalten.
        </p>
        <div className="space-y-3 mb-4">
          <OwnerSwitch
            on={value.askGender !== false}
            onToggle={() => set({ askGender: value.askGender === false })}
            label="Frage: Wer bist du?"
            hint="Der Gast tippt an, was passt — du bestimmst die Antwortmöglichkeiten darunter."
          />
          <OwnerSwitch
            on={value.askOrientation !== false}
            onToggle={() => set({ askOrientation: value.askOrientation === false })}
            label="Frage: Worauf stehst du?"
            hint="Damit die Figuren wissen, in welche Richtung sie gehen dürfen."
          />
        </div>
        <button
          onClick={openIntroPreview}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full glass-btn text-[15px] font-bold text-foreground"
        >
          <Eye className="w-4 h-4" /> Begrüßung ansehen
        </button>
      </div>

      <OptionListEditor
        title="Antworten auf die erste Frage"
        hint="Was der Gast antippen kann. Leer lassen heißt: Mann, Frau, Divers."
        options={value.genderOptions || []}
        onChange={(genderOptions) => set({ genderOptions })}
        defaults={DEFAULT_GENDERS}
        placeholder="Neue Antwort"
      />

      <OptionListEditor
        title="Antworten auf die zweite Frage"
        hint="Was der Gast antippen kann. Leer lassen heißt: Frauen, Männer, Beides, Noch offen."
        options={value.orientationOptions || []}
        onChange={(orientationOptions) => set({ orientationOptions })}
        defaults={DEFAULT_ORIENTATIONS}
        placeholder="Neue Antwort"
      />

      <div className="rounded-2xl border-2 border-border p-4">
        <p className="font-display text-lg text-foreground mb-1">Die Begrüßung selbst</p>
        <p className="text-[13px] font-semibold text-muted-foreground mb-4">
          Das sagen die Erzählerinnen, wenn der Gast ankommt — mit Bild und Stimme.{" "}
          <span className="text-foreground">{"{narrator}"}</span> wird durch ihren Namen ersetzt,{" "}
          <span className="text-foreground">{"{name}"}</span> durch den Namen des Gastes.
        </p>
        <textarea
          value={value.greetingText || ""}
          onChange={(e) => set({ greetingText: e.target.value })}
          rows={4}
          placeholder={DEFAULT_GREETING}
          className={cn(area, "mb-4")}
        />
        <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
          <Volume2 className="inline w-3.5 h-3.5 mr-1" /> Stimme der Begrüßung
        </p>
        <div className="flex flex-wrap gap-1.5">
          {BASE_VOICES.map((v) => (
            <button
              key={v.id}
              onClick={() => set({ guideVoice: v.id })}
              className={cn(
                "px-3.5 py-2 rounded-full text-[12px] font-bold transition-colors",
                (value.guideVoice || "honey") === v.id
                  ? "glass-btn glass-btn-accent text-gloss"
                  : "glass-btn text-muted-foreground"
              )}
            >
              {v.label} <span className="font-semibold opacity-70">{v.hint}</span>
            </button>
          ))}
        </div>
        <button
          onClick={() => set({ greetingText: DEFAULT_GREETING })}
          className="mt-3 px-5 py-2.5 rounded-full text-[14px] font-bold text-muted-foreground hover:text-foreground"
        >
          Zurücksetzen
        </button>
      </div>

      <div className="rounded-2xl border-2 border-border p-4">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="w-4 h-4 text-primary" />
          <p className="font-display text-lg text-foreground">Verhalten, Art & Wortwahl</p>
        </div>
        <p className="text-[13px] font-semibold text-muted-foreground mb-4">
          Wie sie mit dem Gast umgeht: Benehmen, Sprache, Wortwahl, Tempo. Sie führt durch die Auswahl, statt sie nur
          abzufragen — hier steht, wie. Gilt für die Begrüßung und für die Tipps im Story-Modus.
        </p>
        <textarea
          value={value.guideBehavior || ""}
          onChange={(e) => set({ guideBehavior: e.target.value })}
          rows={6}
          placeholder={DEFAULT_GUIDE_BEHAVIOR}
          className={area}
        />
        <button
          onClick={() => set({ guideBehavior: DEFAULT_GUIDE_BEHAVIOR })}
          className="mt-3 px-5 py-2.5 rounded-full text-[14px] font-bold text-muted-foreground hover:text-foreground"
        >
          Zurücksetzen
        </button>
      </div>
    </div>
  );
}