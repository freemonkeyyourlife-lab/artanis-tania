import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { Input } from "@/components/ui/input";

// Eine Liste von Begriffen, die der Gast später angeboten bekommt.
export default function OptionListEditor({ title, hint, options = [], onChange, defaults, placeholder = "Neuer Begriff" }) {
  const [draft, setDraft] = useState("");

  return (
    <div className="rounded-2xl border-2 border-border p-4">
      <p className="font-display text-lg text-foreground mb-1">{title}</p>
      <p className="text-[13px] font-semibold text-muted-foreground mb-4">{hint}</p>

      <div className="flex flex-wrap gap-2 mb-3">
        {options.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-full bg-elevated border border-border text-[13px] font-bold text-foreground"
          >
            {item}
            <button
              onClick={() => onChange(options.filter((_, idx) => idx !== i))}
              className="text-muted-foreground hover:text-destructive"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
        {options.length === 0 && (
          <p className="text-[13px] font-semibold text-muted-foreground">Noch keine — dann gelten die Standardbegriffe.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          className="flex-1 min-w-[200px] h-11 text-[15px] font-semibold"
        />
        <button
          onClick={() => {
            if (!draft.trim()) return;
            onChange([...options, draft.trim()]);
            setDraft("");
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[14px] font-bold text-foreground"
        >
          <Plus className="w-4 h-4" /> Dazulegen
        </button>
        {defaults && (
          <button
            onClick={() => onChange(defaults)}
            className="px-5 py-2.5 rounded-full text-[14px] font-bold text-muted-foreground hover:text-foreground"
          >
            Zurücksetzen
          </button>
        )}
      </div>
    </div>
  );
}