import React from "react";
import { Link } from "react-router-dom";
import { X, Sparkles, Users, Wrench } from "lucide-react";

// Aufklappbare Studio-Schublade: Schnellzugriff auf die drei Studios direkt
// aus der Seitenleiste — ohne die Seite zu verlassen. Die Neuanlage von
// Charakter und Vorlage kommt gleich hier rein dazu.

const LINKS = [
  { to: "/studio", label: "Studio", desc: "Charaktere, Storys, Modelle — alles zentral an einem Ort.", icon: Sparkles },
  { to: "/charakter", label: "Figur-Studio", desc: "Eigene Figuren anlegen und pflegen.", icon: Users },
  { to: "/werkstatt", label: "Werkstatt", desc: "Bausteine und Vorlagen zusammenbauen.", icon: Wrench },
];

export default function StudioSchublade({ onClose, children }) {
  return (
    <div className="fixed inset-0 z-[90]">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="absolute right-0 top-0 bottom-0 w-[min(440px,92vw)] glass-strong border-l border-border flex flex-col piano">
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="font-display text-lg text-foreground">Studio-Schublade</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-muted-foreground hover:bg-elevated hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          <p className="text-xs text-muted-foreground">
            Schnellzugriff auf die Studios — ohne die Seite zu verlassen.
          </p>

          {LINKS.map((l) => {
            const Icon = l.icon;
            return (
              <Link
                key={l.to}
                to={l.to}
                onClick={onClose}
                className="block rounded-2xl border border-border bg-card p-3 hover:border-primary/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-primary" />
                  <p className="font-bold text-foreground">{l.label}</p>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{l.desc}</p>
              </Link>
            );
          })}

          {children}
        </div>
      </div>
    </div>
  );
}