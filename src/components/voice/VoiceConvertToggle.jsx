import React from "react";
import { AudioLines } from "lucide-react";
import { cn } from "@/lib/utils";

// Schalter am Mikrofon: an = deine Aufnahme geht sofort mit der Stimme des
// Charakters raus. Aus = das Mikrofon tippt wie gewohnt nur den Text ein.
export default function VoiceConvertToggle({ on, onChange, disabled, characterName, className }) {
  const title = disabled
    ? "Diesem Charakter ist noch keine Stimme zugeordnet."
    : on
      ? `An — deine Sprachnachrichten klingen wie ${characterName || "der Charakter"}.`
      : "Aus — deine Aufnahme wird nur in Text umgewandelt.";

  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      disabled={disabled}
      title={title}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 h-10 rounded-full border text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-colors disabled:opacity-40",
        on
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-elevated border-border text-muted-foreground hover:text-foreground",
        className
      )}
    >
      <AudioLines className="w-4 h-4" />
      <span className="hidden lg:inline">{on ? "Stimme an" : "Stimme umwandeln"}</span>
    </button>
  );
}