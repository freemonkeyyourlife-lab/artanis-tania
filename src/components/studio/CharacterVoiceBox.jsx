import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Check, Loader2 } from "lucide-react";
import VoicePreviewButton from "@/components/voice/VoicePreviewButton";

const TEST_TEXT = "Hey … ich bin's. Bleib kurz da, ich will dir was sagen.";
const inputCls = "w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:border-primary/50";

function Slider({ label, value, min, max, step, onChange, left, right }) {
  return (
    <div>
      <p className="text-xs font-semibold text-muted-foreground mb-1.5">{label}</p>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-[hsl(var(--primary))]" />
      <div className="flex justify-between text-[10px] text-muted-foreground"><span>{left}</span><span>{right}</span></div>
    </div>
  );
}

// Stimme und Klang direkt am Charakter einstellen — ohne Umweg über ein anderes Werkzeug.
export default function CharacterVoiceBox({ value, onChange }) {
  const [voices, setVoices] = useState([]);
  const [saving, setSaving] = useState(false);
  const [depth, setDepth] = useState(0);
  const [intensity, setIntensity] = useState(50);
  const [speed, setSpeed] = useState(1);

  useEffect(() => { base44.entities.Voice.list("-created_date").then(setVoices).catch(() => {}); }, []);

  const voice = voices.find((v) => v.id === value) || null;

  useEffect(() => {
    setDepth(voice?.depth ?? 0);
    setIntensity(voice?.intensity ?? 50);
    setSpeed(voice?.speed ?? 1);
  }, [voice?.id, voice?.updated_date]);

  const isCloud = voice?.provider === "ELEVENLABS" && voice?.externalVoiceId;
  const draft = voice ? { ...voice, depth, intensity, speed, sampleFile: "" } : null;

  const saveTuning = async () => {
    setSaving(true);
    // Eine automatisch abgelegte Hörprobe passt nach dem Drehen nicht mehr — die fliegt raus.
    const reset = voice.sampleCached ? { sampleFile: "", sampleCached: false } : {};
    await base44.entities.Voice.update(voice.id, { depth, intensity, speed, ...reset });
    setVoices((list) => list.map((v) => (v.id === voice.id ? { ...v, depth, intensity, speed, ...reset } : v)));
    setSaving(false);
  };

  return (
    <div className="sm:col-span-2 rounded-2xl border border-border bg-elevated p-4 space-y-4">
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">Stimme aus der Stimmbank</label>
        <select value={value || ""} onChange={(e) => onChange(e.target.value)} className={inputCls}>
          <option value="">Keine — nur die Grundstimme oben</option>
          {voices.filter((v) => v.active !== false).map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </div>

      {voice ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Slider label={`Tonlage — ${depth > 0 ? "+" : ""}${depth}`} value={depth} min={-25} max={25} step={1} onChange={setDepth} left="tiefer" right="höher" />
            <Slider label={`Intensität — ${intensity}`} value={intensity} min={0} max={100} step={5} onChange={setIntensity} left="ruhig" right="leidenschaftlich" />
            <Slider label={`Tempo — ${speed.toFixed(2)}×`} value={speed} min={0.7} max={1.3} step={0.02} onChange={setSpeed} left="langsam" right="schnell" />
          </div>
          {!isCloud && <p className="text-[11px] text-muted-foreground">Intensität wirkt nur bei ElevenLabs-Stimmen. Tonlage und Tempo wirken bei allen.</p>}
          <div className="flex flex-wrap items-center gap-2">
            <VoicePreviewButton profile={draft} text={TEST_TEXT} useSample={false} />
            <button type="button" onClick={saveTuning} disabled={saving} className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Klang speichern
            </button>
          </div>
        </>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          Noch keine Stimme aus der Stimmbank gewählt. Eine eigene Stimme anlegen oder aus ElevenLabs holen: Studio → Stimmbank.
        </p>
      )}
    </div>
  );
}