import React, { useEffect, useRef, useState } from "react";
import { Image } from "@/components/ui/image";
import { Volume2, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { FIRST_VOICE, NAME_LINE, fillLine } from "@/lib/introStory";

// Erst nur die Stimme, dann kommt sie langsam näher und stellt sich vor.
export default function NarratorArrival({ narrator, name, onSpeak, onStop }) {
  const [phase, setPhase] = useState("voice");
  const [speaking, setSpeaking] = useState(true);
  const started = useRef(false);

  const voiceLine = fillLine(FIRST_VOICE);
  const nameLine = fillLine(NAME_LINE, { narrator: narrator?.name });

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    let alive = true;
    (async () => {
      try {
        await onSpeak?.([FIRST_VOICE]);
      } catch (e) {
        /* ohne Ton geht es trotzdem weiter */
      }
      if (!alive) return;
      setSpeaking(false);
      setPhase("appear");
      setTimeout(() => alive && setPhase("name"), 5200);
    })();
    return () => {
      alive = false;
      onStop?.();
    };
  }, []);

  const replay = async () => {
    setSpeaking(true);
    await onSpeak?.([phase === "name" ? NAME_LINE : FIRST_VOICE]);
    setSpeaking(false);
  };

  return (
    <div className="flex flex-col items-center text-center">
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-5">
        {phase === "voice" ? "Erst nur ihre Stimme" : "Sie kommt näher"}
      </p>

      {phase !== "voice" && (
        <div className="animate-approach">
          <div className="relative w-44 h-44 lg:w-56 lg:h-56 rounded-full overflow-hidden border-2 border-primary/40 accent-glow">
            {narrator?.avatar ? (
              <Image src={narrator.avatar} fittingType="fill" className="w-full h-full" />
            ) : (
              <span className="w-full h-full flex items-center justify-center bg-elevated font-display text-6xl text-primary">
                {(narrator?.name || "?").slice(0, 1)}
              </span>
            )}
          </div>
        </div>
      )}

      {phase === "voice" && (
        <div className="h-44 lg:h-56 flex items-center justify-center">
          <div className="flex items-end gap-1.5 h-12">
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <span
                key={i}
                className="w-1.5 rounded-full bg-primary/70 animate-pulse"
                style={{ height: `${18 + ((i * 13) % 34)}px`, animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
        </div>
      )}

      <p className={cn("mt-6 text-[17px] font-semibold text-foreground leading-relaxed max-w-lg", phase === "voice" && "text-muted-foreground")}>
        „{phase === "name" ? nameLine : voiceLine}"
      </p>

      <button
        onClick={speaking ? onStop : replay}
        className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[14px] font-bold text-foreground"
      >
        {speaking ? <Square className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        {speaking ? "Stopp" : "Nochmal hören"}
      </button>
    </div>
  );
}