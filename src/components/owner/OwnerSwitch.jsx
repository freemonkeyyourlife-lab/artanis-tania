import React from "react";

// Ein Schalter für die Konsole — an oder aus, mit Begründung.
export default function OwnerSwitch({ on, onToggle, label, hint }) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center gap-4 rounded-2xl border-2 border-border p-4 text-left hover:border-primary/50 transition-colors"
    >
      <span className={`w-12 h-7 rounded-full flex-shrink-0 p-1 transition-colors ${on ? "bg-primary" : "bg-border"}`}>
        <span className={`block w-5 h-5 rounded-full bg-background transition-transform ${on ? "translate-x-5" : ""}`} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-[15px] font-bold text-foreground">{label}</span>
        <span className="block text-[13px] font-semibold text-muted-foreground">{hint}</span>
      </span>
      <span className={`text-[12px] font-bold uppercase tracking-wider ${on ? "text-primary" : "text-muted-foreground"}`}>
        {on ? "An" : "Aus"}
      </span>
    </button>
  );
}