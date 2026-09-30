import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PHRASE_STAGES } from "@/lib/phrases";

// Aus der Bank in den Baustein: Zeile aussuchen, ein Klick — sie steht als
// Grundgerüst im Textfeld und du schreibst sie weiter.
export default function PhrasePicker({ onPick }) {
  const [phrases, setPhrases] = useState([]);
  const [stage, setStage] = useState("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.VoicePhrase.list("-created_date", 300)
      .then(setPhrases)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const shown = phrases.filter((p) => {
    if (stage && p.stage !== stage) return false;
    if (!query.trim()) return true;
    return [p.text, p.situation, ...(p.tags || [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query.trim().toLowerCase());
  });

  return (
    <div>
      <h3 className="font-display text-lg text-foreground mb-1">Sprechzeile holen</h3>
      <p className="text-[13px] font-semibold text-muted-foreground mb-4">
        Nimm eine Zeile als Grundgerüst — danach kannst du sie im Textfeld umbauen und erweitern.
      </p>

      <div className="relative mb-3">
        <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Suchen"
          className="h-10 pl-9 text-[14px] font-semibold"
        />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {PHRASE_STAGES.map((s) => (
          <button
            key={s.id}
            onClick={() => setStage(stage === s.id ? "" : s.id)}
            className={cn(
              "px-3 py-1.5 rounded-full border text-[12px] font-bold transition-colors",
              stage === s.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="w-6 h-6 border-4 border-border border-t-primary rounded-full animate-spin" />
        </div>
      ) : shown.length === 0 ? (
        <p className="text-[14px] font-semibold text-muted-foreground text-center py-10">
          Keine Zeile gefunden — leg im Reiter Sprechzeilen eine an.
        </p>
      ) : (
        <div className="max-h-[55vh] overflow-y-auto space-y-2 pr-1">
          {shown.map((p) => (
            <button
              key={p.id}
              onClick={() => onPick(p)}
              className="w-full text-left rounded-xl border-2 border-border p-3 hover:border-primary/50 transition-colors"
            >
              <span className="block text-[11px] font-bold uppercase text-primary mb-1">{p.stage}</span>
              <span className="block text-[14px] font-bold text-foreground">{p.text}</span>
              {p.situation && (
                <span className="block text-[12px] font-semibold text-muted-foreground mt-1">{p.situation}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}