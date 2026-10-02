import React, { useEffect, useState } from "react";
import { Crown, Lock, ShieldCheck, Users } from "lucide-react";
import OwnerSwitch from "@/components/owner/OwnerSwitch";
import { isGodMode, setGodMode, subscribeGodMode } from "@/lib/godMode";
import { cn } from "@/lib/utils";

// Was der Schalter umlegt — damit du nicht raten musst, was gerade gilt.
const ROWS = [
  { icon: ShieldCheck, label: "Altersabfrage", on: "übersprungen", off: "erscheint normal" },
  { icon: Lock, label: "Lust-Fenster beim Start", on: "übersprungen", off: "erscheint normal" },
  { icon: Crown, label: "Verwaltung in der Leiste", on: "immer sichtbar", off: "wie eingestellt" },
  { icon: Users, label: "Blick als Nutzer", on: "wird beendet", off: "frei" },
];

export default function GodModePanel() {
  const [on, setOn] = useState(isGodMode);

  useEffect(() => subscribeGodMode(() => setOn(isGodMode())), []);

  return (
    <div className="space-y-5">
      <OwnerSwitch
        on={on}
        onToggle={() => setGodMode(!on)}
        label="God-Mode"
        hint={
          on
            ? "An: keine Sperren, die Verwaltung steht in der Leiste — alles ist erreichbar."
            : "Aus: die App verhält sich wie bei einem normalen Besucher."
        }
      />

      <div className="glass rounded-2xl border-2 border-border p-5">
        <p className="font-display text-xl text-foreground mb-1 flex items-center gap-2">
          <Crown className={cn("w-5 h-5", on ? "text-yellow-300" : "text-muted-foreground")} /> Was der God-Mode ändert
        </p>
        <p className="text-[15px] font-semibold text-muted-foreground mb-4 max-w-3xl leading-relaxed">
          Er gilt nur für deine eigene Ansicht — für Besucher ändert sich nichts. Zurück geht es mit demselben
          Schalter.
        </p>
        <div className="space-y-2">
          {ROWS.map((r) => {
            const Icon = r.icon;
            return (
              <div
                key={r.label}
                className="flex items-center gap-3 rounded-xl border-2 border-border bg-elevated px-4 py-3"
              >
                <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-[15px] font-bold text-foreground flex-1 min-w-0">{r.label}</span>
                <span
                  className={cn(
                    "text-[12px] font-bold uppercase tracking-wider text-right",
                    on ? "text-yellow-300" : "text-muted-foreground"
                  )}
                >
                  {on ? r.on : r.off}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}