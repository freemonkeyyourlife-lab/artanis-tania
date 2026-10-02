import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, MessagesSquare, Sparkles } from "lucide-react";
import { MOODS } from "@/lib/voiceDj";

// „So redet der Charakter" — aus echten Sätzen aus dem Chat lernt die Stimme,
// wie sie klingen muss. Die Sätze bleiben als Stilproben an der Stimme stehen.
export default function VoiceStyleTrainer({ creatorId, voice, lines, onLines, onApply }) {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const pullFromChat = async () => {
    if (!creatorId) return;
    setBusy(true);
    setNote("");
    try {
      const convos = await base44.entities.Conversation.filter(
        { creatorId },
        { sort: "-lastMessageAt", limit: 8, fields: ["id"] }
      );
      const ids = convos.items.map((c) => c.id);
      if (!ids.length) {
        setNote("Für diesen Charakter gibt es noch keinen Chat-Verlauf.");
        return;
      }
      const messages = await base44.entities.Message.filter(
        { conversationId: { $in: ids }, senderType: "AI" },
        { sort: "-created_date", limit: 30, fields: ["text"] }
      );
      const found = messages.items.map((m) => (m.text || "").trim()).filter(Boolean).slice(0, 12);
      if (!found.length) {
        setNote("Im Verlauf stehen noch keine Sätze des Charakters.");
        return;
      }
      onLines(found.join("\n"));
      setNote(`${found.length} Sätze aus dem Chat übernommen.`);
    } catch (e) {
      console.error(e);
      setNote("Der Verlauf ließ sich nicht lesen.");
    } finally {
      setBusy(false);
    }
  };

  const train = async () => {
    const sample = String(lines || "").trim();
    if (!sample) return;
    setBusy(true);
    setNote("");
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt:
          "Du stellst die Stimme eines Charakters so ein, dass sie zu seiner Art zu reden passt.\n" +
          `So redet der Charakter:\n"""\n${sample.slice(0, 2500)}\n"""\n` +
          `Aktuell eingestellt: Stimmung ${voice?.mood || "NEUTRAL"}, Tempo ${voice?.speed ?? 1}, Tonlage ${voice?.depth ?? 0}, ` +
          `Intensität ${voice?.intensity ?? 50}, Ausklang ${voice?.ending ?? 50}.\n` +
          "Leite daraus die Regler ab: wie schnell spricht er, wie tief, wie leidenschaftlich, wie sehr klingt ein Satz aus, " +
          "wie fest oder schwankend ist die Stimme, wie viel Ausdruck und Betonung liegt darin, wie nah bleibt sie an sich selbst.\n" +
          "Grenzen: Tempo 0.7 bis 1.4 (1 ist normal), Tonlage -40 bis 20 (negativ ist tiefer), Intensität 0 bis 100, " +
          "Ausklang 0 bis 100, Halt 0 bis 100 (hoch ist fest und ruhig), Spiel 0 bis 100 (hoch ist ausdrucksvoll), " +
          "Nähe 0 bis 100 (hoch bleibt nah am Original).\n" +
          "Schreib in note einen kurzen deutschen Satz, wie die Stimme jetzt klingt.",
        response_json_schema: {
          type: "object",
          properties: {
            mood: { type: "string", enum: MOODS.map((m) => m.id) },
            speed: { type: "number" },
            depth: { type: "number" },
            intensity: { type: "number" },
            ending: { type: "number" },
            stability: { type: "number" },
            style: { type: "number" },
            similarity: { type: "number" },
            note: { type: "string" },
          },
          required: ["mood", "speed", "depth", "intensity", "ending", "stability", "style", "similarity", "note"],
        },
      });
      const clamp = (value, lo, hi, fallback) => {
        const n = Number(value);
        return Number.isFinite(n) ? Math.max(lo, Math.min(hi, n)) : fallback;
      };
      onApply({
        mood: MOODS.some((m) => m.id === res.mood) ? res.mood : voice?.mood || "NEUTRAL",
        speed: clamp(res.speed, 0.7, 1.4, voice?.speed ?? 1),
        depth: clamp(res.depth, -40, 20, voice?.depth ?? 0),
        intensity: clamp(res.intensity, 0, 100, voice?.intensity ?? 50),
        ending: clamp(res.ending, 0, 100, voice?.ending ?? 50),
        stability: clamp(res.stability, 0, 100, 50),
        style: clamp(res.style, 0, 100, 20),
        similarity: clamp(res.similarity, 0, 100, 80),
      });
      setNote(res.note || "Die Stimme ist jetzt auf den Chatstil eingestellt.");
    } catch (e) {
      console.error(e);
      setNote("Das hat nicht geklappt — versuch es noch einmal.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
      <div>
        <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          <MessagesSquare className="w-3.5 h-3.5 text-primary" /> An den Chatstil anpassen
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">
          Leg hier ab, wie der Charakter redet — einzeln je Zeile. Daraus stellt sich die Stimme passend ein.
        </p>
      </div>

      <textarea
        value={lines || ""}
        onChange={(e) => onLines(e.target.value)}
        rows={4}
        placeholder={"Komm her … ich hab den ganzen Tag an dich gedacht.\nDu willst doch nicht wirklich gehen."}
        className="w-full px-4 py-3 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-y"
      />

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button" onClick={train} disabled={busy || !String(lines || "").trim()}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {busy ? "Stellt ein …" : "Stimme darauf einstellen"}
        </button>
        {creatorId && (
          <button
            type="button" onClick={pullFromChat} disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-elevated border border-border text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            <MessagesSquare className="w-3.5 h-3.5" /> Sätze aus dem Chat holen
          </button>
        )}
      </div>

      {note && <p className="text-[11px] text-muted-foreground">{note}</p>}
    </div>
  );
}