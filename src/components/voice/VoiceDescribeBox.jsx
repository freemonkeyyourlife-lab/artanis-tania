import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Sparkles } from "lucide-react";
import { MOODS } from "@/lib/voiceDj";
import VoiceInput from "@/components/VoiceInput";

// „So soll sie klingen" — aus einer Beschreibung in Worten werden die Regler.
// Du sagst, wie es gemeint ist, und die Einstellung stellt sich darauf ein.
export default function VoiceDescribeBox({ voice, onApply }) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const apply = async (spoken) => {
    const desc = (typeof spoken === "string" ? spoken : text).trim();
    if (!desc) return;
    setBusy(true);
    setNote("");
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:
          `Du stellst eine Stimme für eine Sprech-App ein. Der Nutzer beschreibt sie so: "${desc}"\n` +
          `Aktuelle Einstellung: Stimmung ${voice?.mood || "NEUTRAL"}, Tempo ${voice?.speed ?? 1}, Tonlage ${voice?.depth ?? 0}, Intensität ${voice?.intensity ?? 50}, Ausklang ${voice?.ending ?? 50}.\n` +
          "Setze die Regler so, dass die Stimme genau so klingt wie beschrieben. " +
          "Tempo 0.7 bis 1.4 (1 ist normal, kleiner ist langsamer). Tonlage -40 bis 20 (negativ ist tiefer, positiv höher). " +
          "Intensität 0 bis 100 (hoch ist leidenschaftlicher). Ausklang 0 bis 100 (hoch lässt die Stimme am Satzende ruhig auslaufen). " +
          "Schreib in note einen kurzen deutschen Satz, was du geändert hast.",
        response_json_schema: {
          type: "object",
          properties: {
            mood: { type: "string", enum: MOODS.map((m) => m.id) },
            speed: { type: "number" },
            depth: { type: "number" },
            intensity: { type: "number" },
            ending: { type: "number" },
            note: { type: "string" },
          },
          required: ["mood", "speed", "depth", "intensity", "ending", "note"],
        },
      });
      const clamp = (v, lo, hi, fallback) => {
        const n = Number(v);
        return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : fallback;
      };
      onApply({
        mood: MOODS.some((m) => m.id === res.mood) ? res.mood : voice?.mood || "NEUTRAL",
        speed: clamp(res.speed, 0.7, 1.4, voice?.speed ?? 1),
        depth: clamp(res.depth, -40, 20, voice?.depth ?? 0),
        intensity: clamp(res.intensity, 0, 100, voice?.intensity ?? 50),
        ending: clamp(res.ending, 0, 100, voice?.ending ?? 50),
      });
      setNote(res.note || "Regler angepasst — hör sie dir an.");
    } catch (e) {
      console.error(e);
      setNote("Das hat nicht geklappt — versuch es noch einmal.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-background p-3">
      <p className="text-xs font-semibold text-muted-foreground mb-1.5">Beschreib, wie sie klingen soll</p>
      <div className="flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && apply()}
          placeholder="z. B. tief, rauchig, spricht langsam und verführerisch"
          className="flex-1 px-4 py-2.5 rounded-full bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
        />
        <VoiceInput title="Einsprechen, wie sie klingen soll" onResult={(t) => { setText(t); apply(t); }} />
        <button
          type="button"
          onClick={() => apply()}
          disabled={busy || !text.trim()}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50 whitespace-nowrap"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {busy ? "Stellt ein …" : "Klang daraus machen"}
        </button>
      </div>
      {note && <p className="text-[11px] text-muted-foreground mt-2">{note}</p>}
    </div>
  );
}