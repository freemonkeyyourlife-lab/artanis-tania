import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { MessageSquare, X, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const GROUP_TITLE = "Freundesraum";

// Randfixiertes Live-Chat-Fenster für Freund:innen. Bleibt beim gemeinsamen
// Anschauen am rechten Rand — eingeklappt nur ein schmaler Reiter, ausgeklappt
// ein Panel. Läuft über eine gemeinsame Gruppe „Freundesraum" in Echtzeit.
export default function LiveEdgeChat() {
  const [me, setMe] = useState(null);
  const [meLoading, setMeLoading] = useState(true);
  const [group, setGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [bootError, setBootError] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => setMe(null)).finally(() => setMeLoading(false));
  }, []);

  useEffect(() => {
    if (meLoading || !me) return;
    let unsub = () => {};
    (async () => {
      try {
        const { items } = await base44.entities.ChatGroup.filter({ title: GROUP_TITLE }, { limit: 1 });
        let g = items[0];
        if (!g) {
          g = await base44.entities.ChatGroup.create({
            title: GROUP_TITLE,
            createdById: me.id,
            createdByName: me.full_name || me.email || "Ich",
            memberIds: [me.id],
            memberCount: 1,
            isPrivate: false,
            lastActivity: new Date().toISOString(),
          });
        }
        setGroup(g);
        const page = await base44.entities.GroupMessage.filter(
          { groupId: g.id },
          { sort: "created_date", limit: 60 }
        );
        setMessages(page.items || []);
        unsub = base44.entities.GroupMessage.subscribe((event) => {
          if (event.type !== "create" || event.data?.groupId !== g.id) return;
          setMessages((prev) => (prev.some((m) => m.id === event.data.id) ? prev : [...prev, event.data]));
        });
      } catch (e) {
        setBootError(e?.message || "Chat nicht verfügbar");
      }
    })();
    return () => unsub();
  }, [meLoading, me]);

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || !group || !me || sending) return;
    setSending(true);
    try {
      const created = await base44.entities.GroupMessage.create({
        groupId: group.id,
        senderId: me.id,
        senderName: me.full_name || me.email || "Ich",
        senderType: "HUMAN",
        text,
      });
      setMessages((prev) => (prev.some((m) => m.id === created.id) ? prev : [...prev, created]));
      setInput("");
      await base44.entities.ChatGroup.update(group.id, { lastActivity: new Date().toISOString() }).catch(() => {});
    } catch (e) {
      /* einzelne Nachricht überspringen */
    } finally {
      setSending(false);
    }
  };

  if (meLoading) return null;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-[60] glass-btn glass-btn-accent rounded-l-2xl rounded-r-none px-2 py-4 flex flex-col items-center gap-1 text-[11px] font-bold text-gloss"
        title="Freunde-Chat öffnen"
      >
        <MessageSquare className="w-4 h-4" />
        <span className="[writing-mode:vertical-rl] rotate-180 tracking-wide">Live-Chat</span>
      </button>
    );
  }

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-[60] w-[340px] max-w-[88vw] h-[72vh] glass-strong rounded-l-2xl rounded-r-none border-2 border-border flex flex-col">
      <div className="flex items-center justify-between px-3 py-2 border-b-2 border-border">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <span className="font-heading text-sm text-foreground">Freunde · Live-Chat</span>
        </div>
        <button onClick={() => setOpen(false)} className="rounded-full p-1.5 hover:bg-elevated text-muted-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-2 scrollbar-hide">
        {!me ? (
          <p className="text-xs text-muted-foreground text-center py-6">Melde dich an, um mitzureden.</p>
        ) : bootError ? (
          <p className="text-xs text-destructive text-center py-6">{bootError}</p>
        ) : messages.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">Noch nichts gesagt — schreib deinen Freund:innen, was du siehst.</p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === me?.id;
            return (
              <div key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[80%] px-3 py-2 rounded-2xl text-sm leading-relaxed", mine ? "bg-primary text-primary-foreground" : "bg-elevated text-foreground")}>
                  {!mine && <p className="text-[10px] font-bold uppercase tracking-wide text-primary mb-0.5">{m.senderName || "Freund"}</p>}
                  {m.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>
      {me && (
        <div className="p-2 border-t-2 border-border flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Schreib was …"
            className="flex-1 rounded-full bg-background border border-border px-3 py-2 text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
          <button onClick={send} disabled={sending || !input.trim()} className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 flex-shrink-0">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      )}
    </div>
  );
}