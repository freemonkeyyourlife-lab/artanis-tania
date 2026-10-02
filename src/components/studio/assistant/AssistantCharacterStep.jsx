import React, { useState } from "react";
import { Image } from "@/components/ui/image";
import { Search, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";

// Schritt 1: Wen richten wir ein?
export default function AssistantCharacterStep({ creators, value, onChange }) {
  const [query, setQuery] = useState("");
  const list = creators.filter((c) => (c.stageName || "").toLowerCase().includes(query.trim().toLowerCase()));

  return (
    <div>
      <p className="font-display text-xl text-foreground mb-1">Mit wem fangen wir an?</p>
      <p className="text-[15px] font-semibold text-muted-foreground mb-4 max-w-2xl">
        Wähle den Charakter, den du einrichten willst. Danach geht der Assistent mit dir die Bilder, das Modell, die
        Bausteine, die Stimme und den Prompt durch.
      </p>

      <div className="relative max-w-md mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Charakter suchen…"
          className="w-full pl-9 h-11 rounded-full bg-card border border-border text-[15px] font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
        />
      </div>

      {list.length === 0 ? (
        <p className="text-[15px] font-semibold text-muted-foreground py-10 text-center">
          {creators.length === 0 ? "Noch keine Charaktere — leg im Reiter „Charaktere“ den ersten an." : "Nichts gefunden."}
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 max-h-[420px] overflow-y-auto pr-1">
          {list.map((c) => (
            <button
              key={c.id}
              onClick={() => onChange(c)}
              className={cn(
                "rounded-2xl border-2 overflow-hidden text-left transition-colors",
                value?.id === c.id ? "border-primary" : "border-border hover:border-primary/50"
              )}
            >
              <span className="block relative aspect-[3/4] bg-elevated">
                {c.avatar ? (
                  <Image src={c.avatar} fittingType="fill" className="w-full h-full" />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                    <ImageOff className="w-6 h-6" />
                  </span>
                )}
              </span>
              <span className="block p-2 text-[13px] font-bold text-foreground truncate">{c.stageName}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}