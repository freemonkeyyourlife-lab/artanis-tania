import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { EMOTIONS, emotionLabel, buildTuningFromSamples } from "@/lib/emotions";
import EmotionSampleRow from "@/components/studio/EmotionSampleRow";
import VoicePreviewButton from "@/components/voice/VoicePreviewButton";
import { BASE_VOICES } from "@/lib/voiceDj";

const input =
  "w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50";

// Deine eigene Stimme: die Sätze einmal in den Stimmungen einsprechen,
// die du wirklich brauchst — daraus wird eine Stimme, die jeden Text spricht.
export default function EmotionVoiceBuilder({ onCreated }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [baseVoice, setBaseVoice] = useState("honey");
  const [samples, setSamples] = useState([]);
  const [building, setBuilding] = useState(false);
  const [result, setResult] = useState(null);

  const setSample = (emotionId, fileUri) =>
    setSamples((list) => [...list.filter((s) => s.emotion !== emotionId), { emotion: emotionId, fileUri }]);

  const removeSample = (emotionId) => setSamples((list) => list.filter((s) => s.emotion !== emotionId));

  const build = async () => {
    if (!name.trim()) {
      toast({ title: "Name fehlt", description: "Gib der Stimme einen Namen.", variant: "destructive" });
      return;
    }
    if (samples.length === 0) {
      toast({ title: "Noch keine Aufnahme", description: "Sprich mindestens eine Stimmung ein.", variant: "destructive" });
      return;
    }
    setBuilding(true);
    try {
      const tuning = buildTuningFromSamples(samples);
      const clone = await base44.functions.invoke("elevenLabsClone", {
        fileUris: samples.map((s) => s.fileUri),
        name: name.trim(),
        description: `Aus ${samples.length} Emotionsproben gebaut (${samples.map((s) => emotionLabel(s.emotion)).join(", ")})`,
      });
      if (clone.data?.error) throw new Error(clone.data.error);

      const created = await base44.entities.Voice.create({
        name: name.trim(),
        description: `Deine eigene Stimme aus ${samples.length} Emotionsproben — Grundstimmung ${tuning.label}.`,
        baseVoice,
        mood: tuning.mood,
        speed: tuning.speed,
        depth: tuning.depth,
        intensity: tuning.intensity,
        provider: "ELEVENLABS",
        externalVoiceId: clone.data.voiceId,
        sampleFile: samples[0].fileUri,
        source: "EINGESPROCHEN",
        originNote: "Aus eigenen Emotionsproben gebaut",
        emotionSamples: samples,
        builtFromEmotions: true,
      });
      setResult(created);
      toast({ title: "Stimme gebaut", description: "Sie steht in der Stimmbank — jetzt einem Charakter zuordnen." });
      onCreated?.();
    } catch (e) {
      toast({ title: "Stimme konnte nicht gebaut werden", description: e.message, variant: "destructive" });
    } finally {
      setBuilding(false);
    }
  };

  return (
    <div className="rounded-2xl border-2 border-primary/30 bg-card p-5 mb-5">
      <p className="font-display text-xl text-foreground mb-1">Eigene Stimme aus Emotionsproben</p>
      <p className="text-sm text-muted-foreground mb-4 max-w-2xl">
        Lies die Sätze so vor, wie du sie meinst — ruhig, sanft, erregt, erschrocken. Aus deinen
        Aufnahmen entsteht eine Stimme, die später jeden Text in diesen Tönen sprechen kann.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Name der Stimme</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Meine Stimme" className={input} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Grundklang (falls etwas fehlt)</label>
          <select value={baseVoice} onChange={(e) => setBaseVoice(e.target.value)} className={input}>
            {BASE_VOICES.map((v) => (
              <option key={v.id} value={v.id}>{v.label} — {v.hint}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        {EMOTIONS.map((emotion) => (
          <EmotionSampleRow
            key={emotion.id}
            emotion={emotion}
            sample={samples.find((s) => s.emotion === emotion.id) || null}
            onRecorded={(fileUri) => setSample(emotion.id, fileUri)}
            onRemove={() => removeSample(emotion.id)}
          />
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-4">
        <button
          type="button"
          onClick={build}
          disabled={building}
          className={cn(
            "inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold disabled:opacity-50",
            "bg-primary text-primary-foreground"
          )}
        >
          {building ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {building ? "Baut …" : `Stimme bauen (${samples.length} Probe${samples.length === 1 ? "" : "n"})`}
        </button>
        {result && <VoicePreviewButton profile={result} text="Hey … ich bin's. So klinge ich jetzt." />}
      </div>
      <p className="text-[11px] text-muted-foreground mt-2">
        Nur deine eigene Stimme verwenden — oder eine, für die du die Erlaubnis hast.
      </p>
    </div>
  );
}