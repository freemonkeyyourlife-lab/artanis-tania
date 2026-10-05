import React, { useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { getChatModule } from "@/lib/chatModule";
import { generateWithModel } from "@/lib/imageGen";

// Bild aus dem Chat heraus: Wunsch beschreiben, die Stimmung färbt es ein, und
// das Ergebnis landet im Gespräch — und dauerhaft im Archiv.
export default function ChatImageTools({ accent, moodStyle, onImage }) {
  const [wish, setWish] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const make = async () => {
    const wishText = wish.trim();
    if (!wishText || busy) return;
    setBusy(true);
    setError("");
    try {
      const prompt = moodStyle ? `${wishText}. ${moodStyle}` : wishText;
      // Ist in den Einstellungen ein Modell gewählt, zeichnet es — sonst der
      // Standard der Plattform.
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

      // Jedes Bild bleibt im Archiv — dort ist es jederzeit wiederzufinden.
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
      setBusy(false);
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
          placeholder="Bild beschreiben … (Enter zeichnet es)"
          className="h-9"
        />
        <Button
          onClick={make}
          disabled={busy || !wish.trim()}
          className="h-9 shrink-0"
          style={accent ? { backgroundColor: accent } : undefined}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
          <span className="ml-1.5 text-xs">Bild</span>
        </Button>
      </div>
      {moodStyle && !error && (
        <p className="pt-1.5 text-[11px] text-muted-foreground">Stimmung fließt ins Bild: {moodStyle}</p>
      )}
      {error && <p className="pt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}