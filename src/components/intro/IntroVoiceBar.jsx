import React from "react";
import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import VoiceInput from "@/components/VoiceInput";

// Er muss nichts anklicken: sie liest vor, was es gibt, er antwortet mit der
// Stimme. Die Angebote stehen daneben auch zum Antippen — für alle, die lieber
// mit der Maus spielen. Beides läuft durch dieselbe Erkennung.
export default function IntroVoiceBar({ options = [], heard, onSay }) {
  if (!options.length) return null;

  return (
    <div className="mt-5 rounded-2xl border-2 border-primary/30 bg-card px-4 py-3">
      <div className="flex items-center gap-3">
        <VoiceInput onResult={onSay} title="Antworte einfach mit der Stimme" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Sag einfach, was du willst</p>
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {options.map((o) => (
              <button
                key={o.id}
                onClick={() => onSay(o.label)}
                className="px-3 py-1 rounded-full bg-elevated text-[12px] font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {heard?.text && (
        <p className={cn("flex items-center gap-1.5 text-[13px] font-semibold mt-2.5", heard.ok ? "text-primary" : "text-muted-foreground")}>
          <Mic className="w-3.5 h-3.5 flex-shrink-0" />
          {heard.ok ? `„${heard.text}" — verstanden.` : `„${heard.text}" — das habe ich nicht erkannt. Sag es nochmal.`}
        </p>
      )}
    </div>
  );
}