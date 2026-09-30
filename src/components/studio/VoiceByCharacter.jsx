import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { SlidersHorizontal } from "lucide-react";
import CharacterVoiceBox from "@/components/studio/CharacterVoiceBox";
import VoiceTuner from "@/components/studio/VoiceTuner";
import { assignVoiceToCreator } from "@/lib/voiceAssign";
import { cn } from "@/lib/utils";

// Die Stimmbank von der anderen Seite gelesen: jeder Charakter mit seiner Stimme
// und den Reglern für Tonlage, Intensität und Tempo direkt darunter.
export default function VoiceByCharacter() {
  const [creators, setCreators] = useState([]);
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tuning, setTuning] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [c, v] = await Promise.all([
      base44.entities.Creator.list("-created_date"),
      base44.entities.Voice.list("-created_date"),
    ]);
    // Artanis und Triania stehen oben — ihre Stimmen werden zuerst fertig gemacht.
    const first = ["Artanis", "Triania"];
    const rank = (creator) => {
      const i = first.indexOf(creator.stageName);
      return i === -1 ? first.length + (creator.active === false ? 1 : 0) : i;
    };
    setCreators(c.sort((a, b) => rank(a) - rank(b)));
    setVoices(v);
    setLoading(false);
  };

  const assign = async (creator, voiceId) => {
    await assignVoiceToCreator(creator.id, voiceId, creators);
    setTuning(null);
    load();
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>;
  }

  if (creators.length === 0) {
    return <p className="text-muted-foreground text-center py-16">Noch keine Charaktere — leg im Studio zuerst einen an.</p>;
  }

  return (
    <div className="space-y-4">
      {creators.map((c) => {
        const voice = voices.find((v) => v.id === c.voiceProfileId);
        return (
          <div key={c.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-3 mb-3">
              {c.avatar ? (
                <Image src={c.avatar} fittingType="fill" className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
              ) : (
                <span className="w-12 h-12 rounded-full bg-elevated flex items-center justify-center font-display text-lg text-primary flex-shrink-0">
                  {c.stageName?.[0]}
                </span>
              )}
              <div>
                <p className="font-display text-base text-foreground">{c.stageName}</p>
                <p className="text-xs text-muted-foreground">
                  {c.voiceProfileId ? "Stimme zugeordnet" : "Noch keine Stimme aus der Stimmbank"}
                </p>
              </div>
            </div>

            <CharacterVoiceBox value={c.voiceProfileId || ""} onChange={(id) => assign(c, id)} />

            {voice ? (
              <>
                <button
                  onClick={() => setTuning(tuning === c.id ? null : c.id)}
                  className={cn(
                    "mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-colors",
                    tuning === c.id ? "bg-primary text-primary-foreground" : "bg-primary/15 text-primary hover:bg-primary/25"
                  )}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" /> Tonlage & Intensität einstellen
                </button>
                {tuning === c.id && (
                  <VoiceTuner key={voice.updated_date} voice={voice} onSaved={() => { setTuning(null); load(); }} />
                )}
              </>
            ) : (
              <p className="mt-3 text-[11px] text-muted-foreground">
                Erst eine Stimme zuordnen — danach kannst du Tonlage und Intensität hier direkt drehen.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}