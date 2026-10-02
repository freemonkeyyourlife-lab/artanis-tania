import React from "react";
import { Link } from "react-router-dom";
import { Check, Sparkles, Mic } from "lucide-react";
import { cn } from "@/lib/utils";
import { assignVoiceToCreator } from "@/lib/voiceAssign";
import { suggestVoice } from "@/lib/assistant";

// Schritt 5: Die Stimme. Erst fragen, dann zuordnen — und jederzeit wieder
// umschalten, indem du einfach eine andere anklickst.
export default function AssistantVoiceStep({ voices, creators, creator, value, onChange, onChanged }) {
  const suggested = suggestVoice(voices, creator);

  const pick = async (v) => {
    onChange(v);
    await assignVoiceToCreator(creator.id, v.id, creators);
    onChanged?.();
  };

  return (
    <div>
      <p className="font-display text-xl text-foreground mb-1">Welche Stimme bekommt {creator?.stageName}?</p>
      <p className="text-[15px] font-semibold text-muted-foreground mb-4 max-w-2xl">
        Die vorgeschlagene Stimme passt zu den Schlagworten der Figur. Klick sie an — oder eine andere. Umstellen geht
        jederzeit, indem du einfach eine andere wählst.
      </p>

      {voices.length === 0 ? (
        <p className="text-[15px] font-semibold text-muted-foreground py-8">
          Noch keine Stimmen da — die entstehen in der Stimmbank oder im Stimmen-Editor.
        </p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-1">
          {voices.map((v) => {
            const active = value?.id === v.id;
            const isSuggested = suggested?.id === v.id;
            return (
              <button
                key={v.id}
                onClick={() => pick(v)}
                className={cn(
                  "rounded-2xl border-2 p-4 text-left transition-colors",
                  active ? "border-primary" : "border-border hover:border-primary/50"
                )}
              >
                <p className="inline-flex items-center gap-2 text-[15px] font-bold text-foreground mb-1">
                  {active && <Check className="w-4 h-4 text-primary" />}
                  {v.name}
                </p>
                {v.description && (
                  <p className="text-[13px] font-semibold text-muted-foreground line-clamp-2">{v.description}</p>
                )}
                {isSuggested && (
                  <p className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-[11px] font-bold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" /> Passt zur Figur
                  </p>
                )}
              </button>
            );
          })}
        </div>
      )}

      {value && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-600/15 text-emerald-400 text-[14px] font-bold">
            <Check className="w-4 h-4" /> {value.name} ist zugeordnet
          </span>
          <Link
            to="/stimmen"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[14px] font-bold text-foreground"
          >
            <Mic className="w-4 h-4" /> Klang fein einstellen
          </Link>
        </div>
      )}
    </div>
  );
}