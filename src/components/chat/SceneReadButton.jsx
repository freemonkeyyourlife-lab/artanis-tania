import React, { useEffect, useState } from "react";
import { Volume2, Square } from "lucide-react";
import { onSceneChange, currentSceneKey, stopScene } from "@/lib/sceneVoice";

// Vorlesen einer ganzen Nachricht — mit allen Stimmen, die darin sprechen.
export default function SceneReadButton({ sceneKey, onRead }) {
  const [playing, setPlaying] = useState(currentSceneKey() === sceneKey);

  useEffect(() => onSceneChange((k) => setPlaying(k === sceneKey)), [sceneKey]);

  return (
    <button
      onClick={() => (playing ? stopScene() : onRead())}
      title={playing ? "Vorlesen stoppen" : "Mit allen Stimmen vorlesen"}
      className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
    >
      {playing ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
      {playing ? "Stopp" : "Vorlesen"}
    </button>
  );
}