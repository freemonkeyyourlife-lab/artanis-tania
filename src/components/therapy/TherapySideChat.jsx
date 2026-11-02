import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Loader2, MessagesSquare } from "lucide-react";
import { cn } from "@/lib/utils";

// Seitenchat am Rand — hier diskutieren Gastgeber und eingeladene Freundin,
// was gerade ausgewählt wird. Läuft parallel zur Therapie, ohne sie zu stören.
export default function TherapySideChat({ session, messages, me, guestName, isGuest }) {
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, sending]);

  if (!session) return null;

  const who = isGuest
    ? (guestName || "Freundin")
    : (me?.full_name || me?.email || "Du");

  const post = async () => {
    const t = text.trim();
    if (!t || sending) return;
    setSending(true);
    try {
      await base44.entities.TherapyMessage.create({
        sessionId: session.id,
        senderType: "GUEST",
        senderName: who,
        text: t,
        channel: "SIDE",
      });
      setText("");
    } catch (e) {
      console.error(e);
    } finally {
      setSending(false);
    }
  };

  return (
    <aside className="rounded-2xl border border-border bg-card p-3 flex flex-col h-[28rem] lg:h-auto lg:max-h-[70vh]">
      <div className="flex items-center gap-1.5 px-1 pb-2 text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
        <MessagesSquare className="w-3.5 h-3.5" /> Seitenchat — diskutiert, was ihr wählt
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-2 py-2">
        {messages.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">
            Hier besprecht ihr euch — Tania liest das nicht mit.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.senderName === who;
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div className="max-w-[85%]">
                  <p className="text-[10px] font-semibold tracking-wider uppercase mb-0.5 text-muted-foreground">
                    {m.senderName || "Gast"}
                  </p>
                  <div className="px-3 py-2 rounded-2xl text-[13px] leading-relaxed whitespace-pre-wrap bg-elevated text-foreground">
                    {m.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {sending && (
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" /> sendet …
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex gap-2 pt-2 border-t border-border">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && post()}
          placeholder="Sag ihr, was du wählen willst …"
          className="flex-1 px-3 py-2 rounded-full bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
        />
        <button
          onClick={post}
          disabled={!text.trim() || sending}
          className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}