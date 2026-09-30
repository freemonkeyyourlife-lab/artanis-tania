import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Check, Loader2 } from "lucide-react";

// Einladen über den Bot: die Einladung geht als Nachricht deines Bots raus —
// nicht aus deinem privaten Telegram.
export default function BotInviteList({ text }) {
  const [guests, setGuests] = useState(null);
  const [busy, setBusy] = useState("");
  const [sent, setSent] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    base44.entities.Conversation.filter({ conversationType: "AI" }, "-lastMessageAt", 40)
      .then((list) => setGuests(list.filter((c) => String(c.participantId || "").startsWith("telegram:"))))
      .catch(() => setGuests([]));
  }, []);

  const send = async (guest) => {
    const chatId = String(guest.participantId || "").replace("telegram:", "");
    if (!chatId) return;
    setBusy(guest.id);
    setError("");
    try {
      const res = await base44.functions.invoke("telegramBot", { action: "send", chatId, text });
      const data = res?.data || {};
      if (data.ok) {
        setSent(guest.id);
        setTimeout(() => setSent(""), 2500);
      } else {
        setError(data.error || "Senden hat nicht geklappt.");
      }
    } catch (e) {
      setError("Senden hat nicht geklappt.");
    } finally {
      setBusy("");
    }
  };

  if (guests === null) {
    return <p className="text-[11px] text-muted-foreground">Telegram-Gäste werden geladen …</p>;
  }

  if (guests.length === 0) {
    return (
      <p className="text-[11px] text-muted-foreground">
        Noch hat niemand deinem Bot geschrieben. Sobald das passiert, kannst du die Einladung direkt über den Bot schicken.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {guests.map((guest) => (
        <div key={guest.id} className="flex items-center gap-2 rounded-xl border border-border bg-elevated px-3 py-2">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground truncate">{guest.userName || "Telegram-Gast"}</p>
            <p className="text-[10px] text-muted-foreground truncate">{guest.participantName || "Telegram"}</p>
          </div>
          <button
            onClick={() => send(guest)}
            disabled={busy === guest.id}
            title="Einladung über den Bot schicken"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold disabled:opacity-50 flex-shrink-0"
          >
            {busy === guest.id ? <Loader2 className="w-3 h-3 animate-spin" /> : sent === guest.id ? <Check className="w-3 h-3" /> : <Send className="w-3 h-3" />}
            {sent === guest.id ? "Raus" : "Einladen"}
          </button>
        </div>
      ))}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}