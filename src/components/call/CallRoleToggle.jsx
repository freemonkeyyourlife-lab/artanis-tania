import React, { useEffect, useState } from "react";
import { User, Clapperboard, Drama, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Rollen-Schalter für alle im Call — Gastgeber wie Gäste. Wählt jeder für sich,
// bleibt lokal gespeichert. Drei Modi: selbst drin, Regie (zuschauen/lenken),
// oder eine Figur spielen.

const MODES = [
  { id: "ME", icon: User, label: "Ich bin ich", hint: "Du bist selbst in der Szene." },
  { id: "DIRECTOR", icon: Clapperboard, label: "Regie", hint: "Zuschauen und lenken." },
  { id: "PLAY", icon: Drama, label: "Ich spiele", hint: "Du übernimmst eine Figur." },
];

const KEY = "artanis_call_role";

function readRole() {
  try { return localStorage.getItem(KEY) || "ME"; } catch { return "ME"; }
}
function writeRole(v) {
  try { localStorage.setItem(KEY, v); } catch { /* privat */ }
}

export default function CallRoleToggle() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("ME");

  useEffect(() => setRole(readRole()), []);

  const pick = (id) => {
    setRole(id);
    writeRole(id);
    setOpen(false);
  };

  const current = MODES.find((m) => m.id === role) || MODES[0];
  const Icon = current.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Deine Rolle im Call"
        className={cn(
          "inline-flex items-center gap-1.5 px-3 h-9 rounded-full text-xs font-semibold transition-colors",
          open ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground"
        )}
      >
        <Icon className="w-4 h-4" /> <span className="hidden sm:inline">{current.label}</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
      </button>
      {open && (
        <>
          <button className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-label="schließen" />
          <div className="absolute right-0 top-11 z-50 w-56 rounded-2xl border border-border bg-popover p-1.5 shadow-2xl">
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => pick(m.id)}
                className={cn(
                  "flex w-full items-start gap-2.5 rounded-xl p-2.5 text-left transition-colors",
                  role === m.id ? "bg-primary/10" : "hover:bg-elevated"
                )}
              >
                <m.icon className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-foreground">{m.label}</span>
                  <span className="block text-[11px] text-muted-foreground leading-snug">{m.hint}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}