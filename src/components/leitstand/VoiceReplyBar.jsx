import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Mic } from "lucide-react";
import HelpButton from "@/components/HelpButton";

// Die Sprach-Steuerung für einen Gast-Chat: welche Stimme spricht — und ob
// jede Antwort zusätzlich als Sprachnachricht rausgeht.
export default function VoiceReplyBar({ conversation, onChanged }) {
  const [voices, setVoices] = useState([]);
  const isTelegram = String(conversation.participantId || "").startsWith("telegram:");

  useEffect(() => {
    if (!isTelegram) return;
    base44.entities.Voice.list("-created_date")
      // Nur Stimmen, die freien Text sprechen können — Aufnahmen können das nicht.
      .then((list) => setVoices(list.filter((v) => v.provider === "ELEVENLABS" && v.externalVoiceId)))
      .catch(() => {});
  }, [isTelegram]);

  if (!isTelegram) return null;

  const update = async (data) => {
    await base44.entities.Conversation.update(conversation.id, data);
    onChanged?.();
  };

  return (
    <div className="px-4 pt-3 flex flex-wrap items-center gap-3 border-t border-border">
      <div className="flex items-center gap-2">
        <Mic className="w-4 h-4 text-primary" />
        <select
          value={conversation.voiceProfileId || ""}
          onChange={(e) => update({ voiceProfileId: e.target.value })}
          className="px-3 py-1.5 rounded-full bg-elevated border border-border text-xs text-foreground focus:outline-none focus:border-primary/50"
        >
          <option value="">Keine Stimme für diesen Chat</option>
          {voices.map((v) => (
            <option key={v.id} value={v.id}>{v.name}</option>
          ))}
        </select>
      </div>

      <label className="inline-flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={conversation.voiceNotes === true}
          onChange={(e) => update({ voiceNotes: e.target.checked })}
          className="accent-[hsl(var(--primary))]"
        />
        Jede Antwort zusätzlich als Sprachnachricht
      </label>

      {voices.length === 0 ? (
        <span className="text-[11px] text-muted-foreground">Noch keine ElevenLabs-Stimme in der Stimmbank.</span>
      ) : conversation.voiceNotes === true && !conversation.voiceProfileId ? (
        <span className="text-[11px] font-semibold text-amber-300">
          Sprachnachricht ist an, aber es fehlt die Stimme — wähle sie links aus, sonst kommt nur Text an.
        </span>
      ) : null}

      <HelpButton topic="sprachnachrichten" className="ml-auto" />
    </div>
  );
}