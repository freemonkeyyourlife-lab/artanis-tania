import React from "react";
import { cn } from "@/lib/utils";
import { Shuffle } from "lucide-react";
import { CAPABILITIES, modelCapabilities } from "@/lib/modelStrengths";

const chip = (on, tone) =>
  cn(
    "px-3 py-1.5 rounded-full border text-[11px] font-bold transition-colors",
    on ? cn("border-transparent", tone) : "bg-background border-border text-muted-foreground hover:text-foreground"
  );

// Sortieren nach Können: nur die Fähigkeiten, die in der eigenen Liste auch
// wirklich vorkommen — und der Schalter, der die vielseitigsten nach oben holt.
export default function ModelCapabilityBar({ models, value, onChange, sort, onSort }) {
  const list = models || [];
  const used = CAPABILITIES.filter((c) => list.some((m) => modelCapabilities(m).includes(c.id)));
  if (!used.length) return null;

  const picked = value || [];
  const toggle = (id) => onChange(picked.includes(id) ? picked.filter((x) => x !== id) : [...picked, id]);

  return (
    <div className="rounded-2xl border border-border bg-elevated p-4 mb-3">
      <div className="flex items-center justify-between gap-3 mb-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Was soll es können?
        </p>
        <div className="flex items-center gap-3">
          {picked.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="text-[11px] font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              Zurücksetzen
            </button>
          )}
          <button
            onClick={() => onSort(sort === "vielfalt" ? "default" : "vielfalt")}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] font-bold transition-colors",
              sort === "vielfalt"
                ? "border-transparent bg-primary/20 text-primary"
                : "bg-background border-border text-muted-foreground hover:text-foreground"
            )}
          >
            <Shuffle className="w-3 h-3" /> Vielfalt zuerst
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {used.map((c) => (
          <button key={c.id} onClick={() => toggle(c.id)} className={chip(picked.includes(c.id), c.tone)}>
            {c.label}
          </button>
        ))}
      </div>

      <p className="text-[11px] font-semibold text-muted-foreground mt-2 leading-relaxed">
        „Vielfalt zuerst" stellt die Modelle nach oben, die am meisten können — Landschaft, Räume, Gegenstände,
        Tiere. Modelle, die nur Gesichter und Körper malen, rutschen nach unten.
      </p>
    </div>
  );
}