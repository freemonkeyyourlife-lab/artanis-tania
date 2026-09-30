import React, { useEffect, useState } from "react";
import { Volume2, Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { splitScene, playScene, stopScene, onSceneChange } from "@/lib/sceneVoice";
import { therapistName } from "@/lib/therapyPrompts";

// Liest die Sitzung als Szene vor: erst er mit seiner Stimme, dann sie mit
// ihrer — so hörst du beiden zu, ohne selbst zu reden.
export default function TherapyReadButton({ session, text, sceneKey = "therapy", className, autoPlay = false }) {
  const [busy, setBusy] = useState(false);
  const [playingKey, setPlayingKey] = useState(null);

  useEffect(() => onSceneChange(setPlayingKey), []);

  const voiceFor = (name) => {
    const actor = session?.actor;
    if (actor?.active && actor.name && String(name || "").toLowerCase() === actor.name.toLowerCase()) {
      return { baseVoice: actor.voice || "storm" };
    }
    return { baseVoice: session?.therapistVoice || "honey" };
  };

  const read = async () => {
    if (!text) return;
    setBusy(true);
    try {
      await playScene(splitScene(text, therapistName(session)), voiceFor, sceneKey);
    } finally {
      setBusy(false);
    }
  };

  // Freisprechen: jede neue Antwort wird von selbst vorgelesen.
  useEffect(() => {
    if (!autoPlay || !text) return;
    read();
    return () => stopScene();
  }, [autoPlay, text]);

  if (!text) return null;
  const speaking = playingKey === sceneKey;

  return (
    <button
      onClick={() => (speaking ? stopScene() : read())}
      disabled={busy}
      title={speaking ? "Vorlesen stoppen" : "Vorlesen — er und sie, jeder mit seiner Stimme"}
      className={cn("inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50", className)}
    >
      {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : speaking ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
      {busy ? "Lädt …" : speaking ? "Stopp" : "Vorlesen"}
    </button>
  );
}