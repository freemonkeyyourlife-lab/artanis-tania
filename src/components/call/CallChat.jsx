import React, { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CallChat({ messages, mySeat, onSend }) {
  const [text, setText] = useState("");
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const submit = () => {
    if (!text.trim()) return;
    onSend(text);
    setText("");
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-xs text-muted-foreground text-center pt-6 px-4">
            Noch keine Nachrichten — alles, was du hier schreibst, sehen alle im Call sofort.
          </p>
        )}
        {messages.map((m, i) => {
          const mine = m.seat === mySeat;
          return (
            <div
              key={i}
              className={cn(
                "max-w-[85%] px-3 py-2 rounded-2xl text-sm break-words",
                mine ? "bg-primary text-primary-foreground ml-auto" : "bg-elevated text-foreground"
              )}
            >
              {!mine && <p className="text-[11px] font-semibold opacity-70 mb-0.5">{m.name || "Gast"}</p>}
              {m.text}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <div className="p-3 border-t border-border flex gap-2 flex-shrink-0">
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="Nachricht an alle…"
          className="flex-1 px-4 py-2.5 rounded-full bg-background border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 appearance-none"
        />
        <button
          onClick={submit}
          disabled={!text.trim()}
          className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center flex-shrink-0 disabled:opacity-50"
          title="Senden"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}