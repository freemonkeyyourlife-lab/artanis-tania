import React from "react";
import ModelTagsPicker from "@/components/studio/ModelTagsPicker";
import { Slider } from "@/components/ui/slider";
import { lengthLabel, toneLabel } from "@/lib/botTraining";

// Die Regler für die Persönlichkeit: Stimmung, Stil, Freizügigkeit, Tonfall.
export default function BotTrainingControls({ value, onChange }) {
  const set = (patch) => onChange({ ...value, ...patch });

  return (
    <div className="space-y-4">
      <ModelTagsPicker
        kind="TEXT"
        value={{ style: value.style, explicit: value.explicit, moods: value.moods }}
        onChange={(next) => set({ style: next.style, explicit: next.explicit, moods: next.moods })}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Tonfall</p>
            <span className="text-[12px] font-bold text-primary">
              {value.tone}/10 · {toneLabel(value.tone)}
            </span>
          </div>
          <Slider
            value={[value.tone]}
            min={1}
            max={10}
            step={1}
            onValueChange={([tone]) => set({ tone })}
          />
          <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
            Links ruhig und zurückhaltend, rechts heiß und schnell mitgerissen.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Antwortlänge</p>
            <span className="text-[12px] font-bold text-primary">
              {value.length} Sätze · {lengthLabel(value.length)}
            </span>
          </div>
          <Slider
            value={[value.length]}
            min={1}
            max={6}
            step={1}
            onValueChange={([length]) => set({ length })}
          />
          <p className="mt-1 text-[11px] font-semibold text-muted-foreground">
            Wie viel der Bot pro Nachricht schreibt.
          </p>
        </div>
      </div>

      <label className="block">
        <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Eigene Anweisung</span>
        <textarea
          value={value.instruction}
          onChange={(e) => set({ instruction: e.target.value })}
          rows={3}
          placeholder="Zum Beispiel: Frag am Ende jeder Antwort nach einem Detail. Nenne nie Preise von selbst."
          className="mt-1.5 w-full px-3 py-2 rounded-xl bg-background border border-border text-[14px] font-semibold text-foreground"
        />
      </label>
    </div>
  );
}