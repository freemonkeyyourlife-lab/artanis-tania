import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import VoicePreviewButton from "@/components/voice/VoicePreviewButton";
import VoiceDescribeBox from "@/components/voice/VoiceDescribeBox";
import VoiceInput from "@/components/VoiceInput";
import { MOODS } from "@/lib/voiceDj";

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

// Schnell-Editor direkt in der Stimmbank: Tonlage, Intensität, Ausklang und
// Tempo — live anhören, speichern. Den Satz zum Anhören kannst du auch reinsprechen.
export default function VoiceTuner({ voice, onSaved }) {
  const [mood, setMood] = useState(voice.mood ?? "NEUTRAL");
  const [depth, setDepth] = useState(voice.depth ?? 0);
  const [intensity, setIntensity] = useState(voice.intensity ?? 50);
  const [ending, setEnding] = useState(voice.ending ?? 50);
  const [speed, setSpeed] = useState(voice.speed ?? 1);
  const [volume, setVolume] = useState(voice.volume ?? 100);
  const [testText, setTestText] = useState(TEST_TEXT);
  const [saving, setSaving] = useState(false);
  const draft = { ...voice, mood, depth, intensity, ending, speed, volume, sampleFile: "" };
  const isCloud = voice.provider === "ELEVENLABS" && voice.externalVoiceId;

  // Aus einer Beschreibung werden die Regler — hören kannst du es direkt danach.
  const applyDescription = (next) => {
    setMood(next.mood);
    setDepth(next.depth);
    setIntensity(next.intensity);
    setEnding(next.ending);
    setSpeed(next.speed);
  };

  const save = async () => {
    setSaving(true);
    // Eine automatisch abgelegte Hörprobe passt nach dem Drehen nicht mehr — die fliegt raus.
    const reset = voice.sampleCached ? { sampleFile: "", sampleCached: false } : {};
    await base44.entities.Voice.update(voice.id, { mood, depth, intensity, ending, speed, volume, ...reset });
    setSaving(false);
    onSaved();
  };

  return (
    <div className="mt-4 rounded-2xl border border-primary/30 bg-elevated p-4 space-y-4">
      <VoiceDescribeBox voice={draft} onApply={applyDescription} />

      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Stimmung</p>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => { setMood(m.id); setSpeed(m.speed); setDepth(m.depth); }}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors",
                mood === m.id ? "bg-primary/20 border-primary text-primary" : "bg-elevated border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        <Slider label={`Lautstärke — ${volume} %`} value={volume} min={0} max={100} step={5} onChange={setVolume} left="leise" right="laut" />
        <Slider label={`Tonlage — ${depth > 0 ? "+" : ""}${depth}`} value={depth} min={-25} max={25} step={1} onChange={setDepth} left="tiefer" right="höher" />
        <Slider label={`Intensität — ${intensity}`} value={intensity} min={0} max={100} step={5} onChange={setIntensity} left="ruhig" right="leidenschaftlich" />
        <Slider label={`Ausklang am Satzende — ${ending}`} value={ending} min={0} max={100} step={5} onChange={setEnding} left="abgehackt" right="kommt runter" />
        <Slider label={`Tempo — ${speed.toFixed(2)}×`} value={speed} min={0.7} max={1.3} step={0.02} onChange={setSpeed} left="langsam" right="schnell" />
      </div>
      <p className="text-[11px] text-muted-foreground">
        Drück auf Anhören und dreh dabei an den Reglern — Lautstärke greift sofort, Tonlage, Intensität,
        Ausklang und Tempo kommen kurz darauf nach. Tippst oder sprichst du unten einen anderen Satz ein,
        wird er gleich neu gesprochen.
        {!isCloud && " Intensität und Ausklang wirken nur bei ElevenLabs-Stimmen."}
      </p>
      <div className="flex items-center gap-2">
        <input
          value={testText}
          onChange={(e) => setTestText(e.target.value)}
          placeholder="Satz zum Anhören"
          className="flex-1 px-4 py-2.5 rounded-full bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
        />
        <VoiceInput onResult={(t) => setTestText(t)} title="Satz reinsprechen statt tippen" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <VoicePreviewButton profile={draft} text={testText || TEST_TEXT} useSample={false} live />
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50">
          {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Klang speichern
        </button>
      </div>
    </div>
  );
}