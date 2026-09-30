import React, { useEffect } from "react";
import { Volume2, Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import useVoicePlayer from "@/hooks/useVoicePlayer";

export default function ReadAloudButton({ text, voice, profile, className, autoPlay = false }) {
  const { speak, halt, speaking, loading, canSpeak } = useVoicePlayer(profile, voice);

  // Freisprechen: jede neue Zeile wird von selbst vorgelesen.
  useEffect(() => {
    if (!autoPlay || !text) return;
    speak(text);
    return () => halt();
  }, [autoPlay, text, speak, halt]);

  if (!text || !canSpeak) return null;

  return (
    <button
      onClick={() => (speaking ? halt() : speak(text))}
      disabled={loading}
      title={speaking ? "Vorlesen stoppen" : "Vorlesen"}
      className={cn("inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50", className)}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : speaking ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
      {loading ? "Lädt …" : speaking ? "Stopp" : "Vorlesen"}
    </button>
  );
}