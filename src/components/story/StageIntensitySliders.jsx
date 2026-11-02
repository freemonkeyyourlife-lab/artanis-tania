import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Gauge, Flame, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Zwei Schieberegler direkt am Kapitel: Tempo und sexuelle Intensität. Beim
// Loslassen wird der Kapitel-Text sofort per KI neu geschrieben und gespeichert
// — kein extra „Anwenden"-Knopf, die Änderung gilt sofort.

const TEMPO = ["Ruhig", "Mittel", "Schnell"];
const INTENSITY = ["Dezent", "Sinnlich", "Explizit", "Hart"];

export default function StageIntensitySliders({ stage, onSaved }) {
  const [tempo, setTempo] = useState(Number(stage?.tempo ?? 1));
  const [intensity, setIntensity] = useState(Number(stage?.intensity ?? 1));
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const lastApplied = useRef(`${tempo}|${intensity}`);

  useEffect(() => {
    setTempo(Number(stage?.tempo ?? 1));
    setIntensity(Number(stage?.intensity ?? 1));
    lastApplied.current = `${Number(stage?.tempo ?? 1)}|${Number(stage?.intensity ?? 1)}`;
  }, [stage?.id]);

  const apply = async (t, i) => {
    const key = `${t}|${i}`;
    if (key === lastApplied.current || busy) return;
    lastApplied.current = key;
    setBusy(true);
    setDone(false);
    try {
      const prompt = `Du bist ein erotischer Story-Autor für ein Hörbuch. Schreibe den folgenden Kapitel-Text neu.

Regeln:
- Tempo: ${TEMPO[t]} (Ruhig = langsam und ausführlich mit viel Atmosphäre, Mittel = normaler Lesefluss, Schnell = zügig und knapp)
- Intensität: ${INTENSITY[i]} (Dezent = subtil und angedeutet, Sinnlich = verspielt erotisch, Explizit = direkt und offen, Hart = sehr explizit und ungefiltert)
- Behalte Handlung und Charaktere bei.
- Schreibe flüssig und bildhaft, geeignet zum Vorlesen.

Originaltext:
${stage.overlayText || stage.title || "(noch kein Text — schreibe einen neuen Kapitel-Text)"}

Gib nur den neuen Text zurück, ohne Erklärungen.`;
      const res = await base44.integrations.Core.InvokeLLM({ prompt, model: "claude-sonnet-5" });
      const text = typeof res === "string" ? res : res?.text || res?.response || String(res);
      await base44.entities.ExperienceStage.update(stage.id, {
        overlayText: text,
        tempo: t,
        intensity: i,
      });
      onSaved?.({ ...stage, overlayText: text, tempo: t, intensity: i });
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-2 rounded-xl bg-background/60 border border-border p-2.5 flex flex-col gap-2">
      <Slider
        icon={Gauge}
        label="Erzähltempo"
        value={tempo}
        max={TEMPO.length - 1}
        labels={TEMPO}
        disabled={busy}
        onChange={setTempo}
        onCommit={() => apply(tempo, intensity)}
      />
      <Slider
        icon={Flame}
        label="Sexuelle Intensität"
        value={intensity}
        max={INTENSITY.length - 1}
        labels={INTENSITY}
        disabled={busy}
        onChange={setIntensity}
        onCommit={() => apply(tempo, intensity)}
      />
      <div className="flex items-center gap-1.5 text-[10px]">
        {busy ? (
          <span className="inline-flex items-center gap-1 text-primary font-bold">
            <Loader2 className="w-3 h-3 animate-spin" /> wird neu geschrieben …
          </span>
        ) : done ? (
          <span className="inline-flex items-center gap-1 text-primary font-bold">
            <Check className="w-3 h-3" /> übernommen
          </span>
        ) : (
          <span className="text-muted-foreground">Regler loslassen — Text wird sofort angepasst & gespeichert.</span>
        )}
      </div>
    </div>
  );
}

function Slider({ icon: Icon, label, value, max, labels, disabled, onChange, onCommit }) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-24 shrink-0">{label}</span>
      <input
        type="range"
        min={0}
        max={max}
        step={1}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        onPointerUp={onCommit}
        onMouseUp={onCommit}
        onTouchEnd={onCommit}
        className="flex-1 h-1.5 accent-primary cursor-pointer disabled:opacity-50"
      />
      <span className="text-[11px] font-bold text-foreground w-16 text-right">{labels[value]}</span>
    </div>
  );
}