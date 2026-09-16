import React from "react";
import { cn } from "@/lib/utils";

const ACTIONS = [
  { label: "📸 Foto bitte", text: "Schick mir ein Foto von dem, was du gerade beschreibst — genau aus meiner Sicht" },
  { label: "👀 Mehr sehen", text: "Zeig mir mehr von dir" },
  { label: "🔥 Heißer", text: "Mach es heißer für mich" },
  { label: "👉 Berühren", text: "Ich fass mich an" },
  { label: "🍆 Wichsen", text: "Ich wichs gerade" },
  { label: "⬆️ Schneller", text: "Schneller, ich will mehr" },
  { label: "💥 Kommen", text: "Ich komme gleich" },
];

export default function QuickActions({ onAction, disabled }) {
  return (
    <div className="px-4 pb-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
      {ACTIONS.map((a) => (
        <button
          key={a.label}
          onClick={() => onAction(a.text)}
          disabled={disabled}
          className="px-3 py-1.5 rounded-full bg-elevated border border-border text-xs text-muted-foreground whitespace-nowrap flex-shrink-0 hover:text-foreground hover:border-primary/50 transition-colors disabled:opacity-40"
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}