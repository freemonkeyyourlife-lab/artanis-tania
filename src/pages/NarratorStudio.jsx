import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Users } from "lucide-react";
import ConciergePanel from "@/components/studio/ConciergePanel";

// Das eigene Studio für die Erzähler-Profile: Bild, Typ, Persönlichkeit und
// Stimme — hier legst du sie an und hörst sie dir an.
export default function NarratorStudio() {
  return (
    <div className="w-full px-4 lg:px-10 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-primary" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Erzähler-Studio</p>
          </div>
          <h1 className="font-display text-3xl text-foreground">Erzähler-Profile</h1>
          <p className="text-[15px] font-semibold text-muted-foreground max-w-2xl leading-relaxed">
            Hier legst du deine Erzählerinnen und Erzähler an: Bild, Typ, Persönlichkeit und Stimme. Zwei davon sind
            im Story-Modus dabei — sie wechseln sich ab und du tauschst sie jederzeit aus.
          </p>
        </div>
        <Link
          to="/studio"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[14px] font-bold text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Zurück ins Studio
        </Link>
      </div>

      <div className="glass rounded-2xl border-2 border-border p-6">
        <ConciergePanel />
      </div>
    </div>
  );
}