import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Image } from "@/components/ui/image";
import VoiceFeelControl from "@/components/voice/VoiceFeelControl";
import VoiceInput from "@/components/VoiceInput";
import { SPEECH_STYLES, styleFor, setStyleFor } from "@/lib/speechStyle";

// Eine Figur im Chat: wie sie klingt (ihre Stimme) und wie sie redet (ihre Wörter).
export default function CharacterDirectCard({ chatId, creator, voice, voices = [], onVoiceSaved }) {
  const [style, setStyle] = useState(() => styleFor(chatId, creator.id));
  const [saved, setSaved] = useState("");

  const saveStyle = (next) => {
    setStyle(next);
    setStyleFor(chatId, creator.id, next);
    setSaved("Übernommen — gilt ab der nächsten Antwort.");
  };

  return (
    <div className="rounded-2xl border-2 border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        {creator.avatar ? (
          <Image src={creator.avatar} fittingType="fill" className="w-10 h-10 rounded-full flex-shrink-0" />
        ) : (
          <span className="w-10 h-10 rounded-full bg-elevated flex items-center justify-center font-display text-primary">{creator.stageName[0]}</span>
        )}
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground truncate">{creator.stageName}</p>
          <p className="text-[11px] text-muted-foreground">Stimme: {voice?.name || "keine zugeordnet"}</p>
        </div>
      </div>

      <VoiceFeelControl creator={creator} voice={voice} voices={voices} onChanged={onVoiceSaved} />

      <div className="rounded-2xl border border-border bg-background p-3">
        <p className="text-xs font-semibold text-muted-foreground mb-2">Wie soll sie reden — welche Wörter?</p>
        <div className="flex flex-wrap gap-1.5 mb-2">
          {SPEECH_STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => saveStyle({ ...style, preset: style.preset === s.id ? null : s.id })}
              className={cn("px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors", style.preset === s.id ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground")}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={style.note}
            onChange={(e) => setStyle({ ...style, note: e.target.value })}
            onBlur={() => saveStyle(style)}
            onKeyDown={(e) => e.key === "Enter" && saveStyle(style)}
            placeholder="z. B. flüstert viel, benutzt Kosenamen, redet wie im Rausch"
            className="flex-1 px-4 py-2.5 rounded-full bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
          <VoiceInput title="Einsprechen, wie sie reden soll" onResult={(t) => saveStyle({ ...style, note: style.note ? style.note + " " + t : t })} />
        </div>
        {saved && <p className="text-[11px] text-muted-foreground mt-2">{saved}</p>}
      </div>
    </div>
  );
}