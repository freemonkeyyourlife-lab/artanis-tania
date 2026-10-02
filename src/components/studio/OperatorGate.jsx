import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Lock } from "lucide-react";

// Die Sperre: hier kommt nur der Betreiber hinein. Alle anderen sehen genau
// diesen Hinweis und den Weg zurück.
export default function OperatorGate() {
  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <Link
        to="/"
        className="flex items-center gap-2 text-[13px] font-bold text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Zurück zur Website
      </Link>
      <div className="glass rounded-2xl border-2 border-border p-5 w-full max-w-2xl">
        <h1 className="font-display text-xl text-foreground flex items-center gap-2">
          <Lock className="w-5 h-5 text-primary" /> Betreiber-Studio
        </h1>
        <p className="mt-1 text-[13px] font-semibold text-muted-foreground">
          Diese Seite gehört dem Betreiber. Melde dich mit dem Betreiber-Konto an.
        </p>
      </div>
    </div>
  );
}