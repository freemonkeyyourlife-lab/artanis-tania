import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Play, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveVoice } from "@/lib/voiceDj";

const SAMPLE_TEXT = "Hey … ich bin's. Bleib kurz da, ich will dir was sagen.";

// Hört sich die eingestellte Stimme an — genau so, wie sie später im Chat klingt.
export default function VoicePreviewButton({ profile, text = SAMPLE_TEXT, className }) {
  const [state, setState] = useState("idle");
  const audioRef = useRef(null);

  const stop = () => {
    if (audioRef.current) audioRef.current.pause();
    audioRef.current = null;
    setState("idle");
  };

  const play = async () => {
    if (state === "playing") { stop(); return; }
    const v = resolveVoice(profile);
    setState("loading");
    try {
      const res = await base44.integrations.Core.GenerateSpeech({ text, voice: v.baseVoice });
      const url = res?.url;
      if (!url) throw new Error("Keine Stimme erhalten");
      const audio = new Audio(url);
      audio.preservesPitch = false;
      audio.webkitPreservesPitch = false;
      audio.playbackRate = v.audioRate;
      audio.onended = () => setState("idle");
      audio.onerror = () => setState("idle");
      audioRef.current = audio;
      await audio.play();
      setState("playing");
    } catch (e) {
      console.error(e);
      setState("idle");
    }
  };

  return (
    <button
      type="button"
      onClick={play}
      disabled={state === "loading"}
      title="Stimme anhören"
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-50",
        state === "playing" ? "bg-primary text-primary-foreground" : "bg-elevated border border-border text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {state === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : state === "playing" ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      {state === "loading" ? "Lädt …" : state === "playing" ? "Stopp" : "Anhören"}
    </button>
  );
}