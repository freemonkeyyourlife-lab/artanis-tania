import React, { useState } from "react";
import { ImagePlus, Video, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getChatModule } from "@/lib/chatModule";
import { generateWithModel } from "@/lib/imageGen";

// Medien aus dem Chat heraus: ein Wunsch, die Stimmung färbt es ein, und das
// Ergebnis landet im Gespräch — und dauerhaft im Archiv. Bilder und Videos.
export default function ChatImageTools({ accent, moodStyle, onImage, onVideo }) {
  const [wish, setWish] = useState("");
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  const make = async () => {
    const wishText = wish.trim();
    if (!wishText || busy) return;
    setBusy("image");
    setError("");
    try {
      const prompt = moodStyle ? `${wishText}. ${moodStyle}` : wishText;
      const chosen = getChatModule().imageModelId;
      let url = "";
      if (chosen) {
        const model = await base44.entities.ImageModel.get(chosen).catch(() => null);
        if (model) url = await generateWithModel(model, prompt);
      }
      if (!url) {
        const res = await base44.integrations.Core.GenerateImage({ prompt });
        url = res?.url;
      }
      if (!url) throw new Error("Es kam kein Bild zurück.");

      try {
        await base44.entities.ImageArchive.create({
          name: wishText.slice(0, 60),
          url,
          kind: "ALLGEMEIN",
          note: "Aus dem Chat-Modul",
        });
      } catch (e) {
        /* Ins Archiv darf nur der Besitzer schreiben — das Bild kommt trotzdem an */
      }

      setWish("");
      await onImage(url, wishText);
    } catch (e) {
      setError(e?.message || "Das Bild kam nicht durch.");
    } finally {
      setBusy("");
    }
  };

  const makeVideo = async () => {
    const wishText = wish.trim();
    if (!wishText || busy) return;
    setBusy("video");
    setError("");
    try {
      const prompt = moodStyle ? `${wishText}. ${moodStyle}` : wishText;
      const res = await base44.integrations.Core.GenerateVideo({
        prompt,
        duration: 6,
        aspect_ratio: "9:16",
      });
      const url = res?.url;
      if (!url) throw new Error("Es kam kein Video zurück.");
      setWish("");
      await onVideo(url, wishText);
    } catch (e) {
      setError(e?.message || "Das Video kam nicht durch.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="border-t border-border px-3 pt-3">
      <div className="flex items-center gap-2">
        <Input
          value={wish}
          onChange={(e) => setWish(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              make();
            }
          }}
          placeholder="Bild oder Video beschreiben … (Enter = Bild)"
          className="h-9"
        />
        <Button
          onClick={make}
          disabled={!!busy || !wish.trim()}
          className="h-9 shrink-0"
          style={accent ? { backgroundColor: accent } : undefined}
        >
          {busy === "image" ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          <span className="ml-1.5 text-xs">Bild</span>
        </Button>
        <Button
          onClick={makeVideo}
          disabled={!!busy || !wish.trim()}
          variant="outline"
          className="h-9 shrink-0"
        >
          {busy === "video" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
          <span className="ml-1.5 text-xs">Video</span>
        </Button>
      </div>
      {moodStyle && !error && (
        <p className="pt-1.5 text-[11px] text-muted-foreground">Stimmung fließt ein: {moodStyle}</p>
      )}
      {error && <p className="pt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}