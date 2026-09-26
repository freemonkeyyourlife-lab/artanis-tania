import React, { useState } from "react";
import { SCENARIOS, FOCUS_TOPICS } from "@/lib/scenarios";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ScenarioSelection({ onSelect }) {
  const [focus, setFocus] = useState(null);
  const list = focus ? SCENARIOS.filter((s) => s.focus?.includes(focus)) : SCENARIOS;

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        <h2 className="font-display text-2xl text-foreground mb-2">Szenario wählen</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Gib ein Szenario vor und spielt es gemeinsam durch. Die KI passt sich an — heimlich, aufregend, echt. Du bekommst echten Content.
        </p>

        <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-2">Worauf willst du hinaus?</p>
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFocus(null)}
            className={cn("px-3 py-1.5 rounded-full border text-xs transition-colors", !focus ? "bg-primary text-primary-foreground border-primary" : "bg-elevated border-border text-muted-foreground hover:text-foreground hover:border-primary/50")}
          >
            Alle
          </button>
          {FOCUS_TOPICS.map((t) => (
            <button
              key={t}
              onClick={() => setFocus(focus === t ? null : t)}
              className={cn("px-3 py-1.5 rounded-full border text-xs transition-colors", focus === t ? "bg-primary text-primary-foreground border-primary" : "bg-elevated border-border text-muted-foreground hover:text-foreground hover:border-primary/50")}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {list.map(s => (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className="flex items-start gap-3 p-4 rounded-xl bg-elevated border border-border text-left hover:border-primary/50 transition-colors"
            >
              <span className="text-2xl flex-shrink-0">{s.icon}</span>
              <div className="min-w-0">
                <p className="font-medium text-foreground text-sm">{s.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
                {s.focus?.length > 0 && (
                  <p className="text-[11px] text-primary/80 mt-1.5">{s.focus.slice(0, 3).join(" · ")}</p>
                )}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={() => onSelect({ id: "free", title: "Freier Chat", icon: "💬", promptContext: "", setupQuestions: [] })}
          className="mt-3 w-full flex items-center justify-center gap-2 p-3 rounded-xl border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          Freier Chat — ohne Szenario
        </button>
      </div>
    </div>
  );
}