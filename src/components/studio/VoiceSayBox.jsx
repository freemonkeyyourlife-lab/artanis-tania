import React, { useMemo, useState } from "react";
import { Volume2 } from "lucide-react";
import VoicePreviewButton from "@/components/voice/VoicePreviewButton";

const DEFAULT_TEXT = "Hey … ich bin's. Bleib kurz da, ich will dir was sagen.";

// Die Sprechprobe: tippen, was gesagt werden soll — und in jeder Stimme sofort hören.
export default function VoiceSayBox({ voices }) {
  const [voiceId, setVoiceId] = useState("");
  const [text, setText] = useState(DEFAULT_TEXT);

  const voice = useMemo(() => voices.find((v) => v.id === voiceId) || voices[0] || null, [voices, voiceId]);
  const speaksFreely = voice?.provider === "ELEVENLABS" && voice?.externalVoiceId;
  const recordingOnly = Boolean(voice?.sampleFile) && !speaksFreely;

  if (voices.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 mb-5">
      <div className="flex items-center gap-2">
        <Volume2 className="w-4 h-4 text-primary" />
        <p className="font-display text-lg text-foreground">Sprechprobe</p>
      </div>
      <p className="text-xs text-muted-foreground mt-0.5">
        Tippe, was gesagt werden soll — und hör es in der Stimme deiner Wahl.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-[240px_1fr] gap-3 mt-4">
        <select
          value={voice?.id || ""}
          onChange={(e) => setVoiceId(e.target.value)}
          className="px-4 py-2.5 rounded-full bg-background border border-border text-sm text-foreground focus:outline-none focus:border-primary/50"
        >
          {voices.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Was soll gesagt werden?"
          className="px-4 py-2.5 rounded-full bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-3">
        <VoicePreviewButton profile={voice} text={text} useSample={false} />
        {recordingOnly && (
          <p className="text-[11px] text-muted-foreground">
            Das ist eine Aufnahme — sie spielt nur die Aufnahme. Klone sie unter „Bearbeiten", dann spricht sie freien Text.
          </p>
        )}
      </div>
    </div>
  );
}