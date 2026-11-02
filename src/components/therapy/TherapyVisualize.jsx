import React, { useState } from "react";
import { Image as ImageIcon, Video as VideoIcon, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { therapistName } from "@/lib/therapyPrompts";
import { sceneImagePrompt, sceneVideoPrompt } from "@/lib/therapyVisual";

// Macht aus der letzten Szene ein Bild oder einen kurzen Clip. Das Ergebnis
// hängt als AI-Nachricht im Verlauf — wie ein gezeichnetes Standbild der Szene.
export default function TherapyVisualize({ session, sceneText, disabled }) {
  const [busy, setBusy] = useState(null); // "image" | "video" | null
  const [error, setError] = useState("");

  const make = async (kind) => {
    if (!sceneText || disabled || busy) return;
    setBusy(kind);
    setError("");
    try {
      let url = "";
      if (kind === "image") {
        const r = await base44.integrations.Core.GenerateImage({
          prompt: sceneImagePrompt(session, sceneText),
        });
        url = r?.url;
      } else {
        const r = await base44.integrations.Core.GenerateVideo({
          prompt: sceneVideoPrompt(session, sceneText),
          duration: 6,
        });
        url = r?.url;
      }
      if (!url) throw new Error("Kein Ergebnis vom Generator.");
      await base44.entities.TherapyMessage.create({
        sessionId: session.id,
        senderType: "AI",
        senderName: therapistName(session),
        text: kind === "image" ? "Ein Bild der Szene." : "Ein kurzer Clip der Szene.",
        images: kind === "image" ? [url] : [],
        videos: kind === "video" ? [url] : [],
      });
    } catch (e) {
      setError(e?.message || "Erzeugung fehlgeschlagen.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => make("image")}
        disabled={!sceneText || !!busy}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-elevated text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        {busy === "image" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ImageIcon className="w-3.5 h-3.5" />}
        Bild der Szene
      </button>
      <button
        onClick={() => make("video")}
        disabled={!sceneText || !!busy}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-elevated text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
      >
        {busy === "video" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <VideoIcon className="w-3.5 h-3.5" />}
        Video der Szene
      </button>
      {error && <span className="text-[11px] text-destructive">{error}</span>}
    </div>
  );
}