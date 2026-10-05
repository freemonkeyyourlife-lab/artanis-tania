import React, { useState } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Bild aus dem Chat heraus: Wunsch beschreiben, Bild landet im Gespräch.
export default function ChatImageTools({ accent, onImage }) {
  const [wish, setWish] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const make = async () => {
    const prompt = wish.trim();
    if (!prompt || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await base44.integrations.Core.GenerateImage({ prompt });
      const url = res?.url;
      if (!url) throw new Error("Es kam kein Bild zurück.");
      setWish("");
      await onImage(url, prompt);
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
      {error && <p className="pt-1.5 text-xs text-destructive">{error}</p>}
    </div>
  );
}