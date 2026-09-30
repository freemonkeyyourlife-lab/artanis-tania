import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import CharacterVoiceBox from "@/components/studio/CharacterVoiceBox";
import { assignVoiceToCreator } from "@/lib/voiceAssign";

// Die Stimmbank von der anderen Seite gelesen: jeder Charakter mit seiner Stimme
// und den Reglern direkt darunter — statt in einer langen Stimmen-Liste.
export default function VoiceByCharacter() {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const data = await base44.entities.Creator.list("-created_date");
    setCreators(data.sort((a, b) => (a.active === false ? 1 : 0) - (b.active === false ? 1 : 0)));
    setLoading(false);
  };

  const assign = async (creator, voiceId) => {
    await assignVoiceToCreator(creator.id, voiceId, creators);
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
      {creators.map((c) => (
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
        </div>
      ))}
    </div>
  );
}