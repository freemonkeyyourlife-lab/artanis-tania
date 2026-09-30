import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Send, X, Sparkles, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { loadStageChoices, stageTitle } from "@/lib/stageChat";

// Der Plattform-Chat, den alle im Call zusammen lesen — und in den jeder
// schreiben kann. Der Gastgeber legt fest, welcher Chat läuft.
export default function CallStagePanel({ stage, stageLines, mySeat, isHost, onOpen, onClose, onSay }) {
  const [choices, setChoices] = useState(null);
  const [text, setText] = useState("");

  useEffect(() => {
    if (stage || !isHost) return;
    let alive = true;
    (async () => {
      let me = null;
      try { me = await base44.auth.me(); } catch (e) { /* Gast ohne Konto */ }
      const list = await loadStageChoices(me?.id);
      if (alive) setChoices(list);
    })();
    return () => { alive = false; };
  }, [stage, isHost]);

  const submit = () => {
    if (!text.trim()) return;
    onSay(text);
    setText("");
  };

  if (stage) {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-border flex-shrink-0">
          <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
          <p className="text-[15px] font-semibold text-foreground flex-1 truncate">{stage.title || "Plattform-Chat"}</p>
          {isHost && (
            <button
              onClick={onClose}
              title="Chat von der Bühne nehmen"
              className="w-8 h-8 rounded-full bg-elevated text-muted-foreground flex items-center justify-center flex-shrink-0 hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {stageLines.length === 0 && (
            <p className="text-sm text-muted-foreground text-center pt-6 px-4">
              {isHost ? "Der Chat ist auf der Bühne — schreib los." : "Warte auf die erste Nachricht …"}
            </p>
          )}
          {stageLines.map((line, i) => {
            const mine = line.seat != null && line.seat === mySeat;
            const isAi = line.senderType === "AI";
            return (
              <div
                key={line.id || i}
                className={cn(
                  "max-w-[88%] px-4 py-3 rounded-2xl text-[15px] leading-relaxed break-words",
                  mine ? "bg-primary text-primary-foreground ml-auto" : "bg-elevated text-foreground"
                )}
              >
                {!mine && (
                  <p className={cn("text-[12px] font-semibold mb-1", isAi ? "text-primary" : "opacity-70")}>
                    {line.sender || "Gast"}
                  </p>
                )}
                {line.text}
              </div>
            );
          })}
        </div>

        <div className="p-3.5 border-t border-border flex gap-2 flex-shrink-0">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="Schreib mit — alle sehen es"
            className="flex-1 px-4 py-3 rounded-full bg-background border border-border text-[15px] text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 appearance-none"
          />
          <button
            onClick={submit}
            disabled={!text.trim()}
            title="Senden"
            className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  if (!isHost) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <Users className="w-8 h-8 text-muted-foreground mb-3" />
        <p className="text-sm text-muted-foreground">
          Der Gastgeber holt gleich einen Plattform-Chat auf die Bühne — dann liest du hier mit.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
      <div className="flex items-center gap-2 px-1 pb-1">
        <Sparkles className="w-5 h-5 text-primary" />
        <p className="text-[15px] font-semibold text-foreground">Chat gemeinsam spielen</p>
      </div>
      <p className="text-[12px] text-muted-foreground px-1 pb-1">
        Wähl einen Chat — alle im Call lesen denselben Verlauf und können mitschreiben.
      </p>

      {choices === null ? (
        <p className="text-[13px] text-muted-foreground px-1">Chats werden geladen …</p>
      ) : choices.length === 0 ? (
        <p className="text-[13px] text-muted-foreground px-1">Noch keine Chats vorhanden.</p>
      ) : (
        choices.map((conversation) => (
          <button
            key={conversation.id}
            onClick={() => onOpen({ id: conversation.id, title: stageTitle(conversation) })}
            className="w-full text-left rounded-2xl border border-border bg-elevated px-4 py-3 hover:border-primary/50 transition-colors"
          >
            <p className="text-[15px] font-semibold text-foreground truncate">{stageTitle(conversation)}</p>
            <p className="text-[12px] text-muted-foreground truncate">
              {conversation.conversationType === "AI" ? "Charakter-Chat" : "Direktnachricht"}
            </p>
          </button>
        ))
      )}
    </div>
  );
}