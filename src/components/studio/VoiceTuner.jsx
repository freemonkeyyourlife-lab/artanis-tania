import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Check, Loader2 } from "lucide-react";
import VoicePreviewButton from "@/components/voice/VoicePreviewButton";

const TEST_TEXT = "Hey … ich bin's. Bleib kurz da, ich will dir was sagen.";

function Slider({ label, value, min, max, step, onChange, left, right }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground mb-1.5">{label}</p>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[hsl(var(--primary))]" />
      <div className="flex justify-between text-[10px] text-muted-foreground"><span>{left}</span><span>{right}</span></div>
    </div>
  );
}

// Schnell-Editor direkt in der Stimmbank: Tonlage, Intensität, Tempo — anhören, speichern.
export default function VoiceTuner({ voice, onSaved }) {
  const [depth, setDepth] = useState(voice.depth ?? 0);
  const [intensity, setIntensity] = useState(voice.intensity ?? 50);
  const [speed, setSpeed] = useState(voice.speed ?? 1);
  const [saving, setSaving] = useState(false);
  const draft = { ...voice, depth, intensity, speed, sampleFile: "" };
  const isCloud = voice.provider === "ELEVENLABS" && voice.externalVoiceId;

  const save = async () => {
    setSaving(true);
    // Eine automatisch abgelegte Hörprobe passt nach dem Drehen nicht mehr — die fliegt raus.
    const reset = voice.sampleCached ? { sampleFile: "", sampleCached: false } : {};
    await base44.entities.Voice.update(voice.id, { depth, intensity, speed, ...reset });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="mt-4 rounded-2xl border border-primary/30 bg-elevated p-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <Slider label={`Tonlage — ${depth > 0 ? "+" : ""}${depth}`} value={depth} min={-25} max={25} step={1} onChange={setDepth} left="tiefer" right="höher" />
        <Slider label={`Intensität — ${intensity}`} value={intensity} min={0} max={100} step={5} onChange={setIntensity} left="ruhig" right="leidenschaftlich" />
        <Slider label={`Tempo — ${speed.toFixed(2)}×`} value={speed} min={0.7} max={1.3} step={0.02} onChange={setSpeed} left="langsam" right="schnell" />
      </div>
      {!isCloud && <p className="text-[11px] text-muted-foreground">Intensität wirkt nur bei ElevenLabs-Stimmen. Tonlage und Tempo wirken bei allen.</p>}
      <div className="flex flex-wrap items-center gap-2">
        <VoicePreviewButton profile={draft} text={TEST_TEXT} useSample={false} />
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Klang speichern
        </button>
      </div>
    </div>
  );
}