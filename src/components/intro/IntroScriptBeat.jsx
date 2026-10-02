import React, { useState } from "react";
import { Volume2, Square, Mic, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { fillLine } from "@/lib/introStory";

// Was sie sagt — Zeile für Zeile, wie in einem Chat. Die Zeilen erscheinen im
// Takt, während sie spricht. Im Hör-Modus bleibt die Mitschrift weg; wer nichts
// hört, kann sie sich mit einem Tipp trotzdem zeigen lassen.
export default function IntroScriptBeat({
  eyebrow,
  lines = [],
  revealed = 0,
  ctx = {},
  mode,
  speaking,
  onSpeak,
  onStop,
  note,
}) {
  const [showScript, setShowScript] = useState(false);
  const hearOnly = mode === "AUDIO" && !showScript;
  const shown = lines.map((l) => fillLine(l, ctx)).slice(0, revealed);

  return (
    <div>
      {eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-3">{eyebrow}</p>}

      {note?.title && (
        <h2 className="font-display text-2xl lg:text-3xl text-foreground text-gloss mb-2">{note.title}</h2>
      )}

      {hearOnly ? (
        <div className="flex items-center gap-3 rounded-2xl border-2 border-border bg-card px-4 py-3 mb-4">
          <Mic className={cn("w-4 h-4 text-primary", speaking && "animate-pulse")} />
          <p className="text-[15px] font-bold text-muted-foreground">
            {speaking ? "Sie erzählt gerade …" : "Sie hat gerade erzählt."}
          </p>
          <button
            onClick={() => setShowScript(true)}
            className="ml-auto inline-flex items-center gap-1.5 text-[12px] font-bold text-primary hover:underline"
          >
            <Eye className="w-3.5 h-3.5" /> Mitschrift zeigen
          </button>
        </div>
      ) : (
        <div className="space-y-2 mb-4 min-h-[64px]">
          {shown.map((line, i) => (
            <p
              key={i}
              className={cn(
                "text-[16px] font-semibold leading-relaxed max-w-xl animate-hero-pop",
                speaking && i === shown.length - 1 ? "text-foreground" : "text-foreground/90"
              )}
            >
              „{line}"
            </p>
          ))}
          {speaking && shown.length < lines.length && (
            <span className="flex gap-1.5 pt-1">
              {[0, 1, 2].map((i) => (
                <span key={i} className="w-1.5 h-1.5 rounded-full bg-primary/70 animate-pulse" style={{ animationDelay: `${i * 150}ms` }} />
              ))}
            </span>
          )}
        </div>
      )}

      {note?.text && (
        <p className="text-[14px] font-semibold text-muted-foreground leading-relaxed max-w-xl mb-4">{note.text}</p>
      )}

      {lines.length > 0 && (
        <button
          onClick={speaking ? onStop : () => onSpeak?.(lines)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[14px] font-bold text-foreground"
        >
          {speaking ? <Square className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          {speaking ? "Stopp" : "Anhören"}
        </button>
      )}
    </div>
  );
}