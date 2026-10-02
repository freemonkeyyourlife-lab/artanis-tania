import React from "react";
import { Link } from "react-router-dom";
import { Lock, Compass, ArrowRight } from "lucide-react";
import { buildNavGroups } from "@/components/nav/HeaderNav";
import { MENU_AREA_LABEL, moduleFor } from "@/lib/modules";
import { cn } from "@/lib/utils";

const NOTE = {
  Charaktere: "Steht immer — deine Hauptfiguren.",
  "Selbst erstellen": "Steht immer — deine Werkstatt.",
  [MENU_AREA_LABEL]: "Deine Knöpfe — hier bestimmst du Reihenfolge, Namen und Ziele.",
  Verwaltung: "Steht immer — nur für dich sichtbar.",
};

const isFree = (label) => label === MENU_AREA_LABEL;

// Die App als Bild: die Leiste oben, darunter ihre vier Bereiche mit jedem
// Knopf und der Seite, auf die er führt.
export default function StructureMap({ items = [] }) {
  const groups = buildNavGroups(items.filter((i) => i && i.path && !i.hidden));

  return (
    <div className="glass rounded-2xl border border-border p-5">
      <p className="font-display text-xl text-foreground mb-1">So ist die App aufgebaut</p>
      <p className="text-[15px] font-semibold text-muted-foreground mb-6 max-w-3xl">
        Oben die Leiste, darunter ihre vier Bereiche. Jeder Knopf sitzt in einem Bereich und führt auf genau eine Seite —
        darunter steht, was dort passiert. Verschieben tust du unten in der Liste.
      </p>

      <div className="rounded-2xl border-2 border-border bg-elevated px-4 py-3 text-center max-w-md mx-auto">
        <p className="font-display text-lg text-foreground">Kopfzeile</p>
        <p className="text-[12px] font-semibold text-muted-foreground">Die Leiste oben — auf jeder Seite sichtbar</p>
      </div>
      <div className="flex justify-center">
        <span className="w-0.5 h-7 bg-border" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {groups.map((group) => (
          <div
            key={group.label}
            className={cn(
              "relative rounded-2xl border-2 bg-card p-4",
              isFree(group.label) ? "border-primary/40" : "border-border"
            )}
          >
            <span className="absolute left-1/2 -top-4 w-0.5 h-4 bg-border" />
            <p className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
              {isFree(group.label) ? <Compass className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              {group.label}
            </p>
            <p className="text-[12px] font-semibold text-muted-foreground mb-3 mt-0.5">{NOTE[group.label]}</p>

            <div className="space-y-2">
              {group.items.map((it) => {
                const page = moduleFor(it.path);
                return (
                  <Link
                    key={`${group.label}-${it.path}`}
                    to={it.path}
                    title="Seite ansehen"
                    className="block rounded-xl border border-border bg-elevated px-3 py-2.5 hover:border-primary/50 transition-colors"
                  >
                    <span className="flex items-center gap-2 flex-wrap">
                      <span className="text-[14px] font-bold text-foreground">{it.label}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <span className="text-[12px] font-bold text-primary">{page?.label || it.path}</span>
                    </span>
                    <span className="block text-[12px] font-semibold text-muted-foreground mt-1 leading-snug">
                      {page?.description || "Kein bekanntes Ziel — unten im Menü umstellen."}
                    </span>
                  </Link>
                );
              })}
              {group.items.length === 0 && (
                <p className="text-[12px] font-semibold text-muted-foreground">Nichts drin.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}