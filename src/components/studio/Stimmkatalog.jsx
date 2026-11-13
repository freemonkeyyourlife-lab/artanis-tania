import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Mic, ArrowRight, Check, BookOpen } from "lucide-react";
import VoiceByCharacter from "@/components/studio/VoiceByCharacter";

// Zentraler Stimmkatalog: die Stimmbank und die feste Zuordnung jeder Figur
// an einem Ort. Einmal zugeordnet, bleibt die Stimme mit dem Charakter
// verknüpft — sie wechselt nicht, nur weil sich die Szene ändert.

const PROVIDER_LABEL = {
  GRUNDSTIMME: "Grundstimme",
  ELEVENLABS: "ElevenLabs",
  VIBE_TTS: "Vibe TTS",
};
const MOOD_LABEL = {
  NEUTRAL: "Neutral",
  SANFT: "Sanft",
  VERFUEHRERISCH: "Verführerisch",
  HEISS: "Heiß",
  SPIELERISCH: "Spielerisch",
  ERNST: "Ernst",
  HART: "Hart",
};

export default function Stimmkatalog({ onOpenTab }) {
  const [voices, setVoices] = useState([]);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [v, c] = await Promise.all([
      base44.entities.Voice.list("-created_date"),
      base44.entities.Creator.list("-created_date"),
    ]);
    setVoices(v);
    setCreators(c);
    setLoading(false);
  };
  useEffect(() => {
    load();
  }, []);

  const assignedCount = creators.filter(
    (c) => c.voiceProfileId && voices.some((v) => v.id === c.voiceProfileId)
  ).length;

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl border-2 border-border p-6">
        <div className="flex items-center gap-2 mb-2">
          <Mic className="w-5 h-5 text-primary" />
          <p className="font-display text-2xl text-foreground">Stimmkatalog</p>
        </div>
        <p className="text-[15px] font-semibold text-muted-foreground max-w-3xl leading-relaxed">
          Jedem Charakter ordnest du hier eine feste Stimme aus der Stimmbank zu. Einmal zugeordnet,
          bleibt sie fest mit dieser Figur verknüpft — sie wechselt nicht, nur weil du die Szene
          wechselst oder eine neue Sitzung beginnst.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="px-3 py-1.5 rounded-full bg-primary/15 text-primary text-[11px] font-bold">
            {assignedCount} / {creators.length} Charaktere mit Stimme
          </span>
          <span className="px-3 py-1.5 rounded-full bg-elevated text-muted-foreground text-[11px] font-bold">
            {voices.length} Stimmen im Katalog
          </span>
        </div>
      </div>

      {/* Zuordnung: jeder Charakter -> feste Stimme */}
      <div className="glass rounded-2xl border-2 border-border p-6">
        <p className="font-display text-xl text-foreground mb-1">Charakteren feste Stimme zuordnen</p>
        <p className="text-xs text-muted-foreground mb-4">
          Das ist die Stimme, die diese Figur immer hat — egal in welcher Szene oder Sitzung.
        </p>
        <VoiceByCharacter />
      </div>

      {/* Katalog: alle Stimmen auf einen Blick + wer sie nutzt */}
      <div className="glass rounded-2xl border-2 border-border p-6">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div>
            <p className="font-display text-xl text-foreground">Stimmbank — alle Stimmen</p>
            <p className="text-xs text-muted-foreground">
              Dein Vorrat an Stimmen. Neue Stimmen legst du in der Stimmbank an und pflegst sie dort.
            </p>
          </div>
          {onOpenTab && (
            <button
              onClick={() => onOpenTab("voices")}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-bold whitespace-nowrap"
            >
              Stimmbank verwalten <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Lade …</p>
        ) : voices.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Noch keine Stimmen. Wechsle zur Stimmbank und leg deine erste an.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {voices.map((v) => {
              const usedBy = creators.filter((c) => c.voiceProfileId === v.id);
              return (
                <div key={v.id} className="rounded-2xl border border-border bg-card p-3">
                  <p className="text-sm font-bold text-foreground truncate">{v.name}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {PROVIDER_LABEL[v.provider] || v.provider} · {MOOD_LABEL[v.mood] || v.mood || "—"}
                  </p>
                  {usedBy.length > 0 ? (
                    <p className="mt-2 text-[11px] text-primary font-semibold flex items-center gap-1">
                      <Check className="w-3 h-3" /> {usedBy.map((c) => c.stageName).join(", ")}
                    </p>
                  ) : (
                    <p className="mt-2 text-[11px] text-muted-foreground">noch niemandem zugeordnet</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}