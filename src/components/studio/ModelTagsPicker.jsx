import React from "react";
import { cn } from "@/lib/utils";
import { EXPLICIT_LEVELS, MOODS, emptyTags, styleOptions } from "@/lib/modelTags";

const chip = (on, tone) =>
  cn(
    "px-3 py-1.5 rounded-full border text-[11px] font-bold transition-colors",
    on ? cn("border-transparent", tone) : "bg-background border-border text-muted-foreground hover:text-foreground"
  );

function Group({ label, children }) {
  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

// Kategorien setzen: Stil, Freizügigkeit und Stimmung — damit später klar ist,
// wofür dieses Modell der beste Griff ist.
export default function ModelTagsPicker({ kind = "BILD", value, onChange }) {
  const tags = value || emptyTags();
  const set = (patch) => onChange({ ...tags, ...patch });
  const toggleMood = (id) =>
    set({ moods: tags.moods.includes(id) ? tags.moods.filter((m) => m !== id) : [...tags.moods, id] });

  return (
    <div className="space-y-3">
      <Group label="Stil">
        {styleOptions(kind).map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => set({ style: tags.style === s.id ? "" : s.id })}
            className={chip(tags.style === s.id, s.tone)}
          >
            {s.label}
          </button>
        ))}
      </Group>

      <Group label="Wie freizügig?">
        {EXPLICIT_LEVELS.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => set({ explicit: tags.explicit === e.id ? "" : e.id })}
            className={chip(tags.explicit === e.id, e.tone)}
          >
            {e.label}
          </button>
        ))}
      </Group>

      <Group label="Stimmung & Sinn (mehrere möglich)">
        {MOODS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => toggleMood(m.id)}
            className={chip(tags.moods.includes(m.id), m.tone)}
          >
            {m.label}
          </button>
        ))}
      </Group>
    </div>
  );
}