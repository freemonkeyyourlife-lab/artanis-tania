import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const BLOCKS = [
  { key: "prompt", label: "Prompt", hint: "In das Prompt-Feld deines externen Studios einfügen." },
  { key: "negative", label: "Negativ-Prompt", hint: "In das Feld „Negative Prompt“ — blockiert, was du nicht willst." },
  {
    key: "lora",
    label: "LoRA-Zusatz",
    hint:
      "Ans Ende des Prompts hängen. 1.5 bis 2.5 drückt kräftig in Richtung unzensiert. Kennt dein Studio das <lora:…> im Text nicht, lass den Tag weg und such dort den Bereich „LoRAs“ oder „Add-ons“ — dort den Regler auf 1.5 bis 2.5 ziehen, das bewirkt dasselbe.",
  },
];

function CopyButton({ text, small }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (e) {
      /* Zwischenablage verweigert. */
    }
  };

  return (
    <button
      onClick={copy}
      className={cn(
        "inline-flex items-center gap-2 rounded-full text-[13px] font-bold transition-colors",
        small ? "px-4 py-2" : "px-5 py-2.5",
        copied ? "bg-emerald-600/20 text-emerald-400" : "glass-btn text-foreground"
      )}
    >
      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
      {copied ? "Kopiert" : "Kopieren"}
    </button>
  );
}

// Fertig zum Mitnehmen: Prompt, Negativ-Prompt und LoRA-Zusatz getrennt —
// jedes Feld mit eigenem Kopier-Knopf.
export default function PromptResult({ result, onChange }) {
  const text = (key) => (typeof result === "string" ? result : result?.[key] || "");
  const filled = BLOCKS.filter((b) => text(b.key));

  if (!filled.length) return null;

  return (
    <div className="mt-5 space-y-4">
      {filled.map((b) => (
        <div key={b.key}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">{b.label}</p>
            <CopyButton text={text(b.key)} small />
          </div>
          <textarea
            value={text(b.key)}
            onChange={onChange ? (e) => onChange({ ...result, [b.key]: e.target.value }) : undefined}
            readOnly={!onChange}
            rows={b.key === "prompt" ? 7 : 3}
            className="w-full px-4 py-3 rounded-2xl bg-card border border-border text-[15px] font-semibold text-foreground focus:outline-none focus:border-primary/50 resize-none"
          />
          <p className="mt-1.5 text-[12px] font-semibold text-muted-foreground">{b.hint}</p>
        </div>
      ))}
    </div>
  );
}