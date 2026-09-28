import React from "react";
import { Hand, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

// Ein Klick entscheidet: ich selbst oder die KI.
export default function TakeoverSwitch({ value, onChange }) {
  return (
    <div className="flex items-center gap-1 p-1 rounded-full bg-elevated border border-border flex-shrink-0">
      <button
        onClick={() => onChange("HUMAN")}
        title="Die KI hält sich in diesem Chat raus"
        className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors", value === "HUMAN" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
      >
        <Hand className="w-3.5 h-3.5" /> Ich übernehme
      </button>
      <button
        onClick={() => onChange("AI")}
        title="Die KI antwortet wieder selbst"
        className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors", value !== "HUMAN" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
      >
        <Bot className="w-3.5 h-3.5" /> KI übernimmt
      </button>
    </div>
  );
}