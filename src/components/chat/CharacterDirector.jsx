import React from "react";
import { SlidersHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import CharacterDirectCard from "@/components/chat/CharacterDirectCard";

// Mitten im Chat: jede Figur im Raum per Beschreibung umstimmen — Klang und Wortwahl.
export default function CharacterDirector({ chatId, people, voices, onVoiceSaved }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 border border-primary/40 text-primary text-[11px] font-semibold whitespace-nowrap hover:bg-primary/25 transition-colors">
          <SlidersHorizontal className="w-3.5 h-3.5" /> Stimme & Sprache
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <h3 className="font-display text-lg text-foreground">Stimme & Sprache</h3>
        <p className="text-xs text-muted-foreground -mt-2">
          Beschreib pro Figur, wie sie klingen soll — tippen oder einsprechen. Die Stimme wird gespeichert (auch im Studio), die Wortwahl gilt für diesen Chat.
        </p>
        <div className="space-y-3">
          {people.filter(Boolean).map((c) => (
            <CharacterDirectCard
              key={c.id}
              chatId={chatId}
              creator={c}
              voice={voices.find((v) => v.id === c.voiceProfileId) || null}
              voices={voices}
              onVoiceSaved={onVoiceSaved}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}