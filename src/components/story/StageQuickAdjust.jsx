import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Sparkles, Gauge, Flame } from "lucide-react";

// Schnell-Regler direkt am Kapitel im Funnel: Tempo und Intensität in einem
// Klick umstellen, „Anwenden" schreibt den Text per KI neu und speichert ihn.

const TEMPO = ["Ruhig", "Mittel", "Schnell"];
const INTENSITY = ["Dezent", "Sinnlich", "Explizit", "Hart"];

export default function StageQuickAdjust({ stage, onSaved }) {
  const [tempo, setTempo] = useState(1);
  const [intensity, setIntensity] = useState(1);
  const [busy, setBusy] = useState(false);

  const apply = async () => {
    setBusy(true);
    try {
      const prompt = `Du bist ein erotischer Story-Autor für ein Hörbuch. Schreibe den folgenden Kapitel-Text neu.

Regeln:
- Tempo: ${TEMPO[tempo]} (Ruhig = langsam und ausführlich mit viel Atmosphäre, Mittel = normaler Lesefluss, Schnell = zügig und knapp)
- Intensität: ${INTENSITY[intensity]} (Dezent = subtil und angedeutet, Sinnlich = verspielt erotisch, Explizit = direkt und offen, Hart = sehr explizit und ungefiltert)
- Behalte Handlung und Charaktere bei.
- Schreibe flüssig und bildhaft, geeignet zum Vorlesen.

Originaltext:
${stage.overlayText || stage.title || "(noch kein Text — schreibe einen neuen Kapitel-Text)"}

Gib nur den neuen Text zurück, ohne Erklärungen.`;
      const res = await base44.integrations.Core.InvokeLLM({ prompt, model: "claude-sonnet-5" });
      const text = typeof res === "string" ? res : res?.text || res?.response || String(res);
      await base44.entities.ExperienceStage.update(stage.id, { overlayText: text });
      onSaved?.({ ...stage, overlayText: text });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
      <Stepper icon={Gauge} label="Tempo" values={TEMPO} index={tempo} onChange={setTempo} />
      <Stepper icon={Flame} label="Intensität" values={INTENSITY} index={intensity} onChange={setIntensity} />
      <button
        onClick={apply}
        disabled={busy}
        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full glass-btn glass-btn-accent text-[11px] font-bold text-gloss disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
        Anwenden
      </button>
    </div>
  );
}

function Stepper({ icon: Icon, label, values, index, onChange }) {
  return (
    <div className="inline-flex items-center gap-0.5 rounded-full glass-btn px-1.5 py-1">
      <Icon className="w-3 h-3 text-primary" />
      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      <button
        onClick={() => onChange((index - 1 + values.length) % values.length)}
        className="w-4 h-4 rounded-full bg-background flex items-center justify-center text-[11px] font-bold text-foreground hover:text-primary"
      >
        ‹
      </button>
      <span className="text-[11px] font-bold text-foreground min-w-[52px] text-center">{values[index]}</span>
      <button
        onClick={() => onChange((index + 1) % values.length)}
        className="w-4 h-4 rounded-full bg-background flex items-center justify-center text-[11px] font-bold text-foreground hover:text-primary"
      >
        ›
      </button>
    </div>
  );
}