import React from "react";
import { DEFAULT_INFO } from "@/lib/onboarding";

// Die Texte hinter den Info-Knöpfen. Jede Zeile ist ein Bereich der App.
export default function InfoTextEditor({ value, onChange }) {
  const texts = value.infoTexts || DEFAULT_INFO;
  const keys = Object.keys(DEFAULT_INFO);

  const set = (key, text) => onChange({ ...value, infoTexts: { ...texts, [key]: text } });

  return (
    <div className="rounded-2xl border-2 border-border p-4">
      <p className="font-display text-lg text-foreground mb-1">Was die Info-Knöpfe sagen</p>
      <p className="text-[13px] font-semibold text-muted-foreground mb-4">
        Kurz und in einfachen Worten. Was hier leer bleibt, zeigt den Standardsatz.
      </p>
      <div className="space-y-3">
        {keys.map((key) => (
          <div key={key}>
            <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">{key}</p>
            <textarea
              value={texts[key] ?? DEFAULT_INFO[key]}
              onChange={(e) => set(key, e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-[14px] font-semibold text-foreground resize-none focus:outline-none focus:border-primary"
            />
          </div>
        ))}
      </div>
      <button
        onClick={() => onChange({ ...value, infoTexts: { ...DEFAULT_INFO } })}
        className="mt-4 px-5 py-2.5 rounded-full text-[14px] font-bold text-muted-foreground hover:text-foreground"
      >
        Alle zurücksetzen
      </button>
    </div>
  );
}