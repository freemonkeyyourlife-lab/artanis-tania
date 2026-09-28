import React from "react";
import { Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const waitingLabel = (iso) => {
  if (!iso) return "";
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  return mins < 1 ? "wartet" : `${mins} Min`;
};

// Alle Chats auf einen Blick: wer wartet, wer dran ist.
export default function LeitstandList({ conversations, activeId, onSelect }) {
  return (
    <div className="overflow-y-auto flex-1">
      {conversations.length === 0 && (
        <p className="p-6 text-sm text-muted-foreground text-center">Noch keine Chats.</p>
      )}
      {conversations.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(c)}
          className={cn("w-full p-4 flex items-center gap-3 border-b border-border text-left transition-colors", activeId === c.id ? "bg-primary/10" : "hover:bg-elevated")}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{c.userName || "Gast"}</p>
            <p className="text-xs text-muted-foreground truncate">mit {c.creatorName || "Charakter"}</p>
          </div>
          {c.waitingSince && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-semibold flex-shrink-0">
              <Clock className="w-3 h-3" /> {waitingLabel(c.waitingSince)}
            </span>
          )}
          {c.handledBy === "HUMAN" && (
            <span className="px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold flex-shrink-0">Du</span>
          )}
        </button>
      ))}
    </div>
  );
}