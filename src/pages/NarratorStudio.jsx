import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Sparkles } from "lucide-react";
import NarratorWorkbench from "@/components/narrator/NarratorWorkbench";

// Hier wird sie fertig: Name, Bild, Stimme, ihre Sätze und die Regie. Danach
// ist sie überall dabei — unten im Eck, auf jeder Seite.
export default function NarratorStudio() {
  return (
    <div className="w-full px-4 lg:px-10 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-primary" />
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Deine Begleiterin</p>
          </div>
          <h1 className="font-display text-3xl text-foreground">Figur-Studio</h1>
          <p className="text-[15px] font-semibold text-muted-foreground max-w-2xl leading-relaxed">
            Erst der Name, dann ihr Bild, ihre Stimme, ihre Sätze und die Regie: wann sie sich meldet und wie lange sie
            stehen bleibt. Sie steht danach unten im Eck und geht mit — auf jeder Seite.
          </p>
        </div>
        <Link
          to="/studio"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[14px] font-bold text-foreground"
        >
          <ArrowLeft className="w-4 h-4" /> Zurück ins Studio
        </Link>
      </div>

      <NarratorWorkbench />
    </div>
  );
}