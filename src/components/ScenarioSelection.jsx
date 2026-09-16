import React from "react";
import { SCENARIOS } from "@/lib/scenarios";
import { MessageCircle } from "lucide-react";

export default function ScenarioSelection({ onSelect }) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto">
        <h2 className="font-display text-2xl text-foreground mb-2">Szenario wählen</h2>
        <p className="text-sm text-muted-foreground mb-6">
          Gib ein Szenario vor und spielt es gemeinsam durch. Die KI passt sich an — heimlich, aufregend, echt. Du bekommst echten Content.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SCENARIOS.map(s => (
            <button
              key={s.id}
              onClick={() => onSelect(s)}
              className="flex items-start gap-3 p-4 rounded-xl bg-elevated border border-border text-left hover:border-primary/50 transition-colors"
            >
              <span className="text-2xl flex-shrink-0">{s.icon}</span>
              <div>
                <p className="font-medium text-foreground text-sm">{s.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
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