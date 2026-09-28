import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import LeitstandList from "@/components/leitstand/LeitstandList";
import LeitstandChat from "@/components/leitstand/LeitstandChat";
import { cn } from "@/lib/utils";

// Wartende Chats stehen oben — die anderen nach der letzten Nachricht.
const sortConversations = (list) => [...list].sort((a, b) => {
  if (!!a.waitingSince !== !!b.waitingSince) return a.waitingSince ? -1 : 1;
  if (a.waitingSince && b.waitingSince) return new Date(a.waitingSince) - new Date(b.waitingSince);
  return new Date(b.lastMessageAt || b.created_date || 0) - new Date(a.lastMessageAt || a.created_date || 0);
});

export default function Leitstand() {
  const [allowed, setAllowed] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const myIdRef = useRef(null);

  const loadConversations = async () => {
    const list = await base44.entities.Conversation.filter({ conversationType: "AI" }, "-lastMessageAt", 60);
    // Die eigenen Chats gehören nicht auf den Leitstand — hier sitzen nur die Gäste.
    setConversations(sortConversations(list.filter((c) => c.userId !== myIdRef.current)));
  };

  const loadMessages = async (id) => {
    if (!id) return;
    setLoadingMsgs(true);
    try {
      const msgs = await base44.entities.Message.filter({ conversationId: id }, "created_date", 200);
      setMessages(msgs);
    } finally {
      setLoadingMsgs(false);
    }
  };

  const refresh = async () => {
    await loadConversations();
    await loadMessages(activeId);
  };

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        if (me?.role !== "admin") { setAllowed(false); return; }
        myIdRef.current = me.id;
        setAllowed(true);
        await loadConversations();
      } catch (e) {
        setAllowed(false);
      }
    })();
  }, []);

  // Neue wartende Chats landen sofort oben, ohne Neuladen.
  useEffect(() => {
    if (!allowed) return;
    let timer;
    const unsubscribe = base44.entities.Conversation.subscribe(() => {
      clearTimeout(timer);
      timer = setTimeout(() => { loadConversations().catch(() => {}); }, 3000);
    });
    return () => { clearTimeout(timer); unsubscribe(); };
  }, [allowed]);

  useEffect(() => {
    if (!allowed || !activeId) return;
    loadMessages(activeId).catch(() => {});
    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event.type !== "create" || event.data?.conversationId !== activeId) return;
      setMessages((prev) => (prev.some((m) => m.id === event.data.id) ? prev : [...prev, event.data]));
    });
    return unsubscribe;
  }, [allowed, activeId]);

  if (allowed === null) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>;
  }

  if (!allowed) {
    return <div className="max-w-2xl mx-auto px-4 py-20 text-center"><p className="text-muted-foreground">Dieser Bereich ist nur für Admins.</p></div>;
  }

  const active = conversations.find((c) => c.id === activeId) || null;
  const waitingCount = conversations.filter((c) => c.waitingSince).length;

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-8">
      <h1 className="font-display text-3xl text-foreground mb-2">Leitstand</h1>
      <p className="text-sm text-muted-foreground mb-6">Alle Chats deiner Gäste. Du siehst sofort, wer wartet — und übernimmst jederzeit selbst.</p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-260px)]">
        <div className={cn("rounded-2xl border border-border bg-card overflow-hidden flex flex-col", active && "hidden lg:flex")}>
          <div className="px-4 py-3 border-b border-border flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Chats</span>
            {waitingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-semibold">{waitingCount} warten</span>
            )}
          </div>
          <LeitstandList conversations={conversations} activeId={activeId} onSelect={(c) => setActiveId(c.id)} />
        </div>

        <div className={cn("lg:col-span-2 rounded-2xl border border-border bg-card flex flex-col", !active && "hidden lg:flex")}>
          {active ? (
            loadingMsgs && messages.length === 0 ? (
              <div className="flex-1 flex items-center justify-center"><div className="w-6 h-6 border-4 border-border border-t-primary rounded-full animate-spin" /></div>
            ) : (
              <LeitstandChat conversation={active} messages={messages} onChanged={refresh} onBack={() => setActiveId(null)} />
            )
          ) : (
            <div className="flex-1 flex items-center justify-center"><p className="text-sm text-muted-foreground">Chat links auswählen</p></div>
          )}
        </div>
      </div>
    </div>
  );
}