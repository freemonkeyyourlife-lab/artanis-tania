import React from "react";
import { Copy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const ROWS = [
  { key: "subject", label: "Motiv" },
  { key: "setting", label: "Umgebung & Gegenstände" },
  { key: "style", label: "Stil" },
  { key: "light", label: "Licht" },
  { key: "colors", label: "Farben" },
  { key: "camera", label: "Kamera & Ausschnitt" },
];

// Was aus dem Bild herausgelesen wurde — fertig zum Kopieren.
export default function ImagePromptResult({ result }) {
  const { toast } = useToast();
  if (!result) return null;

  const copy = (text, label) => {
    navigator.clipboard.writeText(text || "");
    toast({ title: `${label} kopiert` });
  };

  return (
    <div className="mt-4 space-y-3">
      <div className="rounded-xl bg-background border border-border p-4">
        <div className="flex items-center justify-between gap-3 mb-2">
          <span className="text-[13px] font-bold text-primary">Prompt</span>
          <button
            onClick={() => copy(result.prompt, "Prompt")}
            className="flex items-center gap-1.5 text-[12px] font-bold text-muted-foreground hover:text-foreground"
          >
            <Copy className="w-3.5 h-3.5" /> Kopieren
          </button>
        </div>
        <p className="text-[14px] font-semibold text-foreground leading-relaxed whitespace-pre-wrap">{result.prompt}</p>
      </div>

      {result.negative && (
        <div className="rounded-xl bg-background border border-border p-4">
          <div className="flex items-center justify-between gap-3 mb-2">
            <span className="text-[13px] font-bold text-primary">Negativ-Prompt</span>
            <button
              onClick={() => copy(result.negative, "Negativ-Prompt")}
              className="flex items-center gap-1.5 text-[12px] font-bold text-muted-foreground hover:text-foreground"
            >
              <Copy className="w-3.5 h-3.5" /> Kopieren
            </button>
          </div>
          <p className="text-[14px] font-semibold text-foreground leading-relaxed whitespace-pre-wrap">{result.negative}</p>
          <p className="text-[11px] font-semibold text-muted-foreground mt-2 leading-snug">
            Hier stehen die Dinge, die nicht ins Bild sollen. Genauso wichtig wie der Prompt: was fehlt, füllt die
            Maschine mit Zufall.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {ROWS.filter((r) => result[r.key]).map((r) => (
          <div key={r.key} className="rounded-xl bg-background border border-border p-3">
            <span className="block text-[12px] font-bold text-muted-foreground mb-1">{r.label}</span>
            <span className="block text-[13px] font-semibold text-foreground">{result[r.key]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}