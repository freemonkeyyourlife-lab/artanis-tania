import React from "react";
import { Mic } from "lucide-react";
import VoiceByCharacter from "@/components/studio/VoiceByCharacter";
import StimmenExtraktor from "@/components/voice/StimmenExtraktor";

// Eine Seite nur für Stimmen: jeder Charakter mit seinen Reglern für Tonlage,
// Intensität, Ausklang und Tempo — anhören, speichern, ohne Umweg.
export default function VoiceStudio() {
  return (
    <div className="w-full px-4 lg:px-10 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-foreground flex items-center gap-3">
          <Mic className="w-7 h-7 text-primary" /> Stimmen
        </h1>
        <p className="text-[15px] font-semibold text-muted-foreground mt-2 max-w-2xl">
          Jeder Charakter mit seiner Stimme: Tonlage und Intensität drehen, anhören und speichern —
          einzeln, ohne das Studio zu öffnen.
        </p>
      </div>
      <StimmenExtraktor />
      <VoiceByCharacter />
    </div>
  );
}