import React from "react";
import { Ear, Play, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLAY_LEVELS } from "@/lib/playStyle";

const seg = (active) =>
  cn(
    "px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors",
    active ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground"
  );

// Wer spricht — und wie viel Gas die Szene hat. Alles an einem Ort, damit man
// nicht raten muss, wer als Nächstes redet.
export default function SpeakerBar({ speakAs, onSpeakAs, creators, playLevel, onPlayLevel, busy, onContinue }) {
  const listening = speakAs === "LISTEN";
  const asCharacter = creators.find((c) => c.id === speakAs) || null;

  return (
    <div className="px-4 py-2.5 border-b border-border flex flex-wrap items-center gap-x-5 gap-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Wer spricht</span>
        <button onClick={() => onSpeakAs("ME")} className={seg(speakAs === "ME")} title="Du schreibst selbst — die Figuren im Raum antworten dir">
          <User className="w-3 h-3 inline mr-1" />Ich
        </button>
        <select
          value={asCharacter ? asCharacter.id : ""}
          onChange={(e) => onSpeakAs(e.target.value || "ME")}
          title="Du schreibst als diese Figur — die anderen antworten"
          className={cn(
            "px-3 py-1.5 rounded-full text-[11px] font-semibold border focus:outline-none",
            asCharacter ? "bg-primary text-primary-foreground border-primary" : "bg-elevated border-border text-muted-foreground"
          )}
        >
          <option value="">Ich als …</option>
          {creators.map((c) => (
            <option key={c.id} value={c.id}>{c.stageName}</option>
          ))}
        </select>
        <button onClick={() => onSpeakAs("LISTEN")} className={seg(listening)} title="Du sagst nichts — die Figuren spielen von allein weiter">
          <Ear className="w-3 h-3 inline mr-1" />Nur zuhören
        </button>
        {listening && (
          <button onClick={onContinue} disabled={busy} className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-primary text-primary-foreground disabled:opacity-50">
            <Play className="w-3 h-3 inline mr-1" />Weiter
          </button>
        )}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Gas</span>
        {PLAY_LEVELS.map((l) => (
          <button key={l.id} onClick={() => onPlayLevel(l.id)} title={l.hint} className={seg(playLevel === l.id)}>
            {l.label}
          </button>
        ))}
      </div>
    </div>
  );
}