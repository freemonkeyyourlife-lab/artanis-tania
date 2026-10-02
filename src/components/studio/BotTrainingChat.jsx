import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Send, Loader2, RotateCcw, ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// Das Testgespräch: hier wird sofort sichtbar, wie sich das Training anfühlt.
export default function BotTrainingChat({ personaLabel, messages, busy, block, onSend, onReset }) {
  const [text, setText] = useState("");
  const [showBlock, setShowBlock] = useState(false);

  const submit = () => {
    const t = text.trim();
    if (!t || busy) return;
    setText("");
    onSend(t);
  };

  return (
    <div className="rounded-2xl border-2 border-border bg-card p-4 flex flex-col">
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-primary" />
        <span className="text-[15px] font-bold text-foreground">Testgespräch</span>
        <span className="text-[12px] font-semibold text-muted-foreground">
          Antworten als {personaLabel} — mit den Reglern links
        </span>
        <span className="flex-1" />
        <button
          onClick={() => setShowBlock((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full glass-btn text-[12px] font-bold text-muted-foreground"
        >
          Trainings-Block
          <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", !showBlock && "-rotate-90")} />
        </button>
        <button
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full glass-btn text-[12px] font-bold text-muted-foreground"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Neu anfangen
        </button>
      </div>

      {showBlock && (
        <pre className="mb-3 p-3 rounded-xl bg-background border border-border text-[11px] leading-relaxed font-mono text-muted-foreground whitespace-pre-wrap break-words">
          {block}
        </pre>
      )}

      <div className="flex-1 min-h-[260px] max-h-[460px] overflow-y-auto space-y-2 pr-1">
        {messages.length === 0 ? (
          <p className="text-[14px] font-semibold text-muted-foreground text-center py-16">
            Schreib unten zum Beispiel „Hallo" und sieh, wie {personaLabel} mit diesen Einstellungen antwortet.
          </p>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
              <div
                className={cn(
                  "max-w-[85%] px-3.5 py-2.5 rounded-2xl border text-[14px] font-semibold leading-relaxed whitespace-pre-wrap",
                  m.role === "user"
                    ? "bg-primary/15 border-primary/30 text-foreground"
                    : "bg-elevated border-border text-foreground"
                )}
              >
                {m.role !== "user" && (
                  <p className="text-[10px] font-bold uppercase tracking-wider text-primary mb-1">
                    KI · {personaLabel}
                  </p>
                )}
                {m.text}
              </div>
            </div>
          ))
        )}
        {busy && (
          <div className="flex items-center gap-2 text-[13px] font-semibold text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin text-primary" /> {personaLabel} überlegt …
          </div>
        )}
      </div>

      <div className="flex gap-2 mt-3">
        <Input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Deine Nachricht …"
          className="flex-1 h-11 text-[15px] font-semibold"
        />
        <button
          onClick={submit}
          disabled={busy || !text.trim()}
          className="inline-flex items-center gap-2 px-6 h-11 rounded-full bg-primary text-primary-foreground text-[15px] font-bold disabled:opacity-50 whitespace-nowrap"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Senden
        </button>
      </div>
    </div>
  );
}