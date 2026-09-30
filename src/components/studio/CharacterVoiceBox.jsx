import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Check, Loader2, Mic, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import VoicePreviewButton from "@/components/voice/VoicePreviewButton";
import useVoiceRecorder from "@/hooks/useVoiceRecorder";

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
export default function CharacterVoiceBox({ value, onChange, characterName = "" }) {
  const [voices, setVoices] = useState([]);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [depth, setDepth] = useState(0);
  const [intensity, setIntensity] = useState(50);
  const [speed, setSpeed] = useState(1);

  useEffect(() => { base44.entities.Voice.list("-created_date").then(setVoices).catch(() => {}); }, []);

  // Eigene Stimme direkt hier einsprechen: sie wird gebaut, abgelegt und
  // dem Charakter zugeordnet — ohne Umweg über die Stimmbank.
  const record = useVoiceRecorder(async (fileUri) => {
    setCreating(true);
    try {
      const name = characterName.trim() || "Neue Stimme";
      const clone = await base44.functions.invoke("elevenLabsClone", {
        fileUri,
        name,
        description: `Direkt am Charakter „${name}“ eingesprochen`,
      });
      if (clone.data?.error) throw new Error(clone.data.error);
      const created = await base44.entities.Voice.create({
        name,
        description: "Direkt am Charakter eingesprochen",
        provider: "ELEVENLABS",
        externalVoiceId: clone.data.voiceId,
        sampleFile: fileUri,
        source: "EINGESPROCHEN",
        originNote: "Am Charakter aufgenommen",
      });
      setVoices((list) => [created, ...list]);
      onChange(created.id);
    } catch (e) {
      console.error(e);
    } finally {
      setCreating(false);
    }
  });

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

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => record.toggle(`${(characterName || "stimme").toLowerCase().replace(/\s+/g, "-")}.webm`)}
          disabled={record.busy || creating}
          className={cn(
            "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-colors disabled:opacity-50",
            record.recording ? "bg-red-500 text-white animate-pulse" : "bg-primary text-primary-foreground"
          )}
        >
          {record.busy || creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : record.recording ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          {creating ? "Baut Stimme …" : record.busy ? "Lädt …" : record.recording ? "Stopp" : "Neue Stimme einsprechen"}
        </button>
        <span className="text-[11px] text-muted-foreground">
          Sprich etwa 30 Sekunden frei — daraus wird die Stimme dieses Charakters und sie ist sofort ausgewählt.
        </span>
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