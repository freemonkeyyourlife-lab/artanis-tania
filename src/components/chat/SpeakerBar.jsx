import React from "react";
import { Clapperboard, Play, User, Drama, Settings2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLAY_LEVELS } from "@/lib/playStyle";
import { speakAsFromRole } from "@/lib/chatRole";
import { stopScene } from "@/lib/sceneVoice";

const seg = (active) =>
  cn(
    "px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors",
    active ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground"
  );

// Meine Rolle in der Szene, wer gerade spricht, und wie viel Gas.
export default function SpeakerBar({ role, onRole, onEditRoles, creators, playLevel, onPlayLevel, busy, onContinue }) {
  const current = speakAsFromRole(role);
  const played = creators.filter((c) => role.playing.includes(c.id));

  return (
    <div className="px-4 py-2.5 border-b border-border flex flex-wrap items-center gap-x-5 gap-y-2">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Du</span>
        {role.mode === "ME" && <span className={seg(true)}><User className="w-3 h-3 inline mr-1" />Ich bin ich</span>}
        {role.mode === "DIRECTOR" && (
          <>
            <span className={seg(true)}><Clapperboard className="w-3 h-3 inline mr-1" />Regie</span>
            <button onClick={onContinue} disabled={busy} className="px-3 py-1.5 rounded-full text-[11px] font-semibold bg-primary/15 border border-primary/40 text-primary disabled:opacity-50">
              <Play className="w-3 h-3 inline mr-1" />Weiter
            </button>
          </>
        )}
        {role.mode === "PLAY" && played.map((c) => (
          <button key={c.id} onClick={() => onRole({ ...role, current: c.id })} title={`Jetzt schreibst du als ${c.stageName}`} className={seg(current === c.id)}>
            <Drama className="w-3 h-3 inline mr-1" />{c.stageName}
          </button>
        ))}
        <button onClick={onEditRoles} title="Wer dabei ist und wer du bist" className={seg(false)}>
          <Settings2 className="w-3 h-3 inline mr-1" />Rollen
        </button>
        <button onClick={stopScene} title="Vorlesen stoppen" className={seg(false)}>
          <VolumeX className="w-3 h-3 inline" />
        </button>
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