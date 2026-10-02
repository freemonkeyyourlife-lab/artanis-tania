import React from "react";
import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

// −1 heißt: nicht von Hand eingestellt, der Klang folgt weiter der Stimmung.
export const AUTO = -1;

function Row({ label, value, hint, left, right, onChange }) {
  const auto = !(Number(value) >= 0);
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 gap-2">
        <p className="text-xs font-semibold text-muted-foreground">
          {label} — {auto ? "automatisch" : value}
        </p>
        {!auto && (
          <button type="button" onClick={() => onChange(AUTO)} className="text-[10px] text-muted-foreground hover:text-foreground whitespace-nowrap">
            zurück auf Stimmung
          </button>
        )}
      </div>
      <input
        type="range" min="0" max="100" step="5" value={auto ? 50 : value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={cn("w-full accent-[hsl(var(--primary))]", auto && "opacity-50")}
      />
      <div className="flex justify-between text-[10px] text-muted-foreground"><span>{left}</span><span>{right}</span></div>
      {hint && <p className="text-[10px] text-muted-foreground mt-1">{hint}</p>}
    </div>
  );
}

// Der Feinschliff einer Stimme: Halt, Spiel und Nähe — dazu Präsenz.
// Ohne eigene Einstellung bleibt alles wie von der Stimmung vorgegeben.
export default function VoiceFineTune({ voice, onChange }) {
  const v = voice || {};
  return (
    <div className="rounded-2xl border border-border bg-background p-4 space-y-4">
      <div>
        <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          <SlidersHorizontal className="w-3.5 h-3.5 text-primary" /> Feinschliff
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">
          Greift bei geklonten Stimmen (ElevenLabs). Bleibt ein Regler auf „automatisch“, richtet er sich weiter nach der Stimmung.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Row
          label="Halt" value={v.stability ?? AUTO}
          left="schwankend" right="ganz fest"
          hint="Fest hält die Stimme ruhig, schwankend lässt sie atmen."
          onChange={(n) => onChange({ stability: n })}
        />
        <Row
          label="Spiel" value={v.style ?? AUTO}
          left="nüchtern" right="ausdrucksvoll"
          hint="Mehr Spiel heißt mehr Betonung und Farbe."
          onChange={(n) => onChange({ style: n })}
        />
        <Row
          label="Nähe" value={v.similarity ?? AUTO}
          left="frei" right="nah am Original"
          hint="Wie dicht die Ausgabe an der Ursprungsstimme bleibt."
          onChange={(n) => onChange({ similarity: n })}
        />
      </div>

      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <input
          type="checkbox"
          checked={v.presence !== false}
          onChange={(e) => onChange({ presence: e.target.checked })}
          className="accent-[hsl(var(--primary))]"
        />
        Präsenz — die Stimme steht klar vor dem Hintergrund
      </label>
    </div>
  );
}