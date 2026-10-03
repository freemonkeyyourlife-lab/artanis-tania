import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toList, customId, customText, isCustom } from "@/lib/imageDirection";

// Eine Reihe Regler. Mehrere dürfen gleichzeitig an sein — Pool UND Dusche,
// Stil UND Stimmung. Was fehlt, tippst du unten selbst dazu.
export default function DirectionPickRow({ label, options, value, onChange, multi = true, addLabel = "Eigenes" }) {
  const [offen, setOffen] = useState(false);
  const [neu, setNeu] = useState("");
  const list = multi ? toList(value) : value ? [value] : [];
  const isOn = (id) => list.includes(id);

  const toggle = (id) => {
    if (!multi) return onChange(value === id ? "" : id);
    onChange(isOn(id) ? list.filter((x) => x !== id) : [...list, id]);
  };

  const add = () => {
    const text = neu.trim();
    if (!text) return;
    const id = customId(text);
    if (!isOn(id)) onChange([...list, id]);
    setNeu("");
    setOffen(false);
  };

  const eigene = list.filter((id) => isCustom(id) && !options.some((o) => o.id === id));

  const chip = (on) =>
    cn(
      "px-3 py-1.5 rounded-full text-[12px] font-bold border transition-colors",
      on ? "bg-primary/20 text-primary border-primary/40" : "bg-card text-muted-foreground border-border hover:text-foreground"
    );

  return (
    <div>
      <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
        {label}
        {multi && <span className="ml-2 normal-case tracking-normal font-semibold text-muted-foreground/70">mehrere möglich</span>}
      </p>
      <div className="flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button key={o.id} type="button" onClick={() => toggle(o.id)} className={chip(isOn(o.id))}>
            {o.label}
          </button>
        ))}

        {eigene.map((id) => (
          <span key={id} className={cn(chip(true), "inline-flex items-center gap-1.5 pl-3 pr-1.5")}>
            {customText(id)}
            <button
              type="button"
              onClick={() => toggle(id)}
              title="Entfernen"
              className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}

        {multi &&
          (offen ? (
            <span className="inline-flex items-center gap-1.5">
              <input
                autoFocus
                value={neu}
                onChange={(e) => setNeu(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    add();
                  }
                  if (e.key === "Escape") setOffen(false);
                }}
                placeholder={`${addLabel} eintippen …`}
                className="px-3 py-1.5 rounded-full bg-background border border-border text-[12px] font-semibold text-foreground placeholder:text-muted-foreground w-44"
              />
              <button type="button" onClick={add} className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[12px] font-bold">
                dazu
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => setOffen(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-dashed border-border text-[12px] font-bold text-muted-foreground hover:text-foreground"
            >
              <Plus className="w-3 h-3" /> {addLabel}
            </button>
          ))}
      </div>
    </div>
  );
}