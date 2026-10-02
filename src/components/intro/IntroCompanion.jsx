import React, { useState } from "react";
import { Image } from "@/components/ui/image";
import { Volume2, Square, X, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { RECALL_LINES, RECALL_TIPS, fillLine } from "@/lib/introStory";

// Sie sitzt oben im Eck, raucht eine und schaut zu. Rückrufen geht immer —
// dann quatscht sie rein, liest vor und gibt Tipps.
export default function IntroCompanion({ narrator, speaking, onSpeak, onStop }) {
  const [open, setOpen] = useState(false);

  const open_ = async () => {
    setOpen(true);
    await onSpeak?.(RECALL_LINES);
  };

  return (
    <div className="fixed top-20 right-4 lg:right-6 z-[99] w-[min(92vw,340px)]">
      {!open && (
        <button
          onClick={open_}
          title="Sie rückrufen"
          className="ml-auto flex items-center gap-2 pl-1.5 pr-4 py-1.5 rounded-full glass-strong border-2 border-border hover:border-primary/60 transition-colors"
        >
          <span className="relative w-9 h-9 rounded-full overflow-hidden border-2 border-primary/50 flex-shrink-0">
            {narrator?.avatar ? (
              <Image src={narrator.avatar} fittingType="fill" className="w-full h-full" />
            ) : (
              <span className="w-full h-full flex items-center justify-center bg-elevated font-display text-sm text-primary">
                {(narrator?.name || "?").slice(0, 1)}
              </span>
            )}
          </span>
          <span className="text-[13px] font-bold text-foreground">{narrator?.name || "Sie"} rückrufen</span>
        </button>
      )}

      {open && (
        <div className="rounded-2xl glass-strong border-2 border-primary/40 p-4 accent-glow">
          <div className="flex items-center gap-2 mb-3">
            <MessageCircle className={cn("w-4 h-4 text-primary", speaking && "animate-pulse")} />
            <p className="text-[12px] font-bold uppercase tracking-wider text-primary">Sie ist da</p>
            <button onClick={() => setOpen(false)} className="ml-auto w-7 h-7 rounded-full bg-elevated flex items-center justify-center">
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-2">
            {RECALL_LINES.map((l, i) => (
              <p key={i} className="text-[14px] font-semibold text-foreground leading-relaxed">„{fillLine(l, { narrator: narrator?.name })}"</p>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t-2 border-border">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Ihre Tipps</p>
            <div className="space-y-1.5">
              {RECALL_TIPS.map((t, i) => (
                <p key={i} className="text-[13px] font-semibold text-muted-foreground leading-relaxed">„{t}"</p>
              ))}
            </div>
          </div>

          <button
            onClick={speaking ? onStop : () => onSpeak?.(RECALL_LINES)}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full glass-btn text-[13px] font-bold text-foreground"
          >
            {speaking ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            {speaking ? "Stopp" : "Anhören"}
          </button>
        </div>
      )}
    </div>
  );
}