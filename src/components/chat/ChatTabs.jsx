import React from "react";
import { X, Sparkles, User } from "lucide-react";
import { cn } from "@/lib/utils";

// Mehrere Gespräche gleichzeitig offen halten und mit einem Klick wechseln.
export default function ChatTabs({ tabs, activeId, onActivate, onClose }) {
  if (tabs.length < 2) return null;
  return (
    <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border overflow-x-auto scrollbar-hide flex-shrink-0">
      {tabs.map((t) => (
        <div
          key={t.id}
          onClick={() => onActivate(t)}
          className={cn(
            "flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full text-xs whitespace-nowrap cursor-pointer transition-colors flex-shrink-0",
            activeId === t.id ? "bg-primary/15 text-primary font-semibold" : "text-muted-foreground hover:text-foreground hover:bg-elevated"
          )}
        >
          {t.type === "ai" ? <Sparkles className="w-3 h-3 flex-shrink-0" /> : <User className="w-3 h-3 flex-shrink-0" />}
          <span className="max-w-[130px] truncate">{t.name}</span>
          <button
            onClick={(e) => { e.stopPropagation(); onClose(t.id); }}
            title="Chat schließen"
            className="w-4 h-4 rounded-full flex items-center justify-center hover:bg-background/60 flex-shrink-0"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}