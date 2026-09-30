import React, { useEffect, useState } from "react";
import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { assignVoiceToCreator } from "@/lib/voiceAssign";
import { voiceNotesOn, voiceDecided, setVoiceNotesOn } from "@/lib/voiceChat";
import HelpButton from "@/components/HelpButton";

// Die eine Steuerung: welche Stimme spricht — und ob die Antworten zusätzlich
// als Sprachnachricht rausgehen. Gilt für Chat, Videochat und Telegram.
export default function VoiceChatBar({ creator, creators = [], voices = [], onChanged, className }) {
  const current = voices.find((v) => v.id === creator?.voiceProfileId) || null;
  const [on, setOn] = useState(() => voiceNotesOn(creator?.id, !!current));

  // Stimme neu zugewiesen und noch nichts entschieden? Dann läuft sie an.
  useEffect(() => {
    if (!voiceDecided(creator?.id)) setOn(voiceNotesOn(creator?.id, !!current));
  }, [creator?.id, current?.id]);

  if (!creator?.id) return null;

  const pick = async (voiceId) => {
    await assignVoiceToCreator(creator.id, voiceId, creators);
    onChanged?.();
  };

  const toggle = () => {
    const next = !on;
    setOn(next);
    setVoiceNotesOn(creator.id, next);
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-[11px] font-semibold text-muted-foreground">
        <Mic className="w-3.5 h-3.5 text-primary" />
        Stimme: <span className="text-foreground">{current?.name || "keine"}</span>
      </span>
      <select
        value={current?.id || ""}
        onChange={(e) => pick(e.target.value)}
        title="Welche Stimme dieser Charakter spricht"
        className="px-3 py-1.5 rounded-full bg-elevated border border-border text-[11px] font-semibold text-muted-foreground focus:outline-none focus:border-primary/50"
      >
        <option value="">Keine Stimme</option>
        {voices.map((v) => (
          <option key={v.id} value={v.id}>{v.name}</option>
        ))}
      </select>
      <button
        onClick={toggle}
        title="Antworten zusätzlich als Sprachnachricht"
        className={cn(
          "px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors",
          on ? "bg-primary text-primary-foreground" : "bg-elevated border border-border text-muted-foreground hover:text-foreground"
        )}
      >
        {on ? "Sprachnachricht ✓" : "Sprachnachricht"}
      </button>
      <HelpButton topic="chatstimme" />
    </div>
  );
}