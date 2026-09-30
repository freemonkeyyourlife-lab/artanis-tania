import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Bot } from "lucide-react";
import LeitstandChat from "@/components/leitstand/LeitstandChat";

const isTelegram = (conversation) => String(conversation?.participantId || "").startsWith("telegram:");

// Der Bot im Call: schmal, damit du im Call bleibst und trotzdem parallel mit
// deinen Telegram-Gästen schreibst.
export default function CallBotPanel() {
  const [guests, setGuests] = useState(null);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const myIdRef = useRef(null);

  const loadGuests = async () => {
    const list = await base44.entities.Conversation.filter({ conversationType: "AI" }, "-lastMessageAt", 40);
    const telegram = list.filter((c) => isTelegram(c) && c.userId !== myIdRef.current);
    setGuests(telegram);
    return telegram;
  };

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        myIdRef.current = me?.id;
      } catch (e) {
        // nicht angemeldet — dann bleibt es bei allen Bot-Chats
      }
      try {
        await loadGuests();
      } catch (e) {
        setGuests([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!active) return;
    setLoading(true);
    base44.entities.Message.filter({ conversationId: active.id }, "created_date", 200)
      .then(setMessages)
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));

    const unsubscribe = base44.entities.Message.subscribe((event) => {
      if (event.type !== "create" || event.data?.conversationId !== active.id) return;
      setMessages((prev) => (prev.some((m) => m.id === event.data.id) ? prev : [...prev, event.data]));
    });
    return unsubscribe;
  }, [active]);

  // Nach dem Senden die Liste frisch holen — so stimmt auch der Übernahme-Schalter.
  const refresh = async () => {
    try {
      const telegram = await loadGuests();
      if (active) {
        const again = telegram.find((c) => c.id === active.id);
        if (again) setActive(again);
      }
    } catch (e) {
      // still
    }
  };

  if (active) {
    return loading && messages.length === 0 ? (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-6 h-6 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    ) : (
      <LeitstandChat conversation={active} messages={messages} onChanged={refresh} onBack={() => setActive(null)} />
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-2">
      <div className="flex items-center gap-2 px-1 pb-1">
        <Bot className="w-4 h-4 text-primary" />
        <p className="text-xs font-semibold text-foreground">Dein Bot</p>
      </div>

      {guests === null ? (
        <p className="text-[11px] text-muted-foreground px-1">Chats werden geladen …</p>
      ) : guests.length === 0 ? (
        <p className="text-[11px] text-muted-foreground px-1">
          Noch hat niemand deinem Bot geschrieben. Sobald jemand schreibt, taucht der Chat hier auf.
        </p>
      ) : (
        guests.map((guest) => (
          <button
            key={guest.id}
            onClick={() => setActive(guest)}
            className="w-full text-left rounded-xl border border-border bg-elevated px-3 py-2 hover:border-primary/50 transition-colors"
          >
            <p className="text-xs font-semibold text-foreground truncate">{guest.userName || "Telegram-Gast"}</p>
            <p className="text-[10px] text-muted-foreground truncate">
              {guest.waitingSince ? "wartet auf Antwort" : guest.participantName || "Telegram"}
            </p>
          </button>
        ))
      )}
    </div>
  );
}