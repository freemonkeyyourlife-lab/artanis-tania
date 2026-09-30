import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Send, Check, Loader2 } from "lucide-react";
import { callGuestUrl, guestInviteText, inviteCode } from "@/lib/callLink";

// Deine Telegram-Leute, direkt aus dem Call heraus: ankreuzen, senden — jeder
// bekommt seinen eigenen persönlichen Link. Schreiben kann der Bot nur denen,
// die ihm schon einmal geschrieben haben; genau die stehen hier.
export default function CallTelegramInvites({ token, roomNumber, onCreate }) {
  const [guests, setGuests] = useState(null);
  const [picked, setPicked] = useState({});
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    base44.entities.Conversation
      .filter({ participantId: { $regex: "^telegram:" } }, "-lastMessageAt", 50)
      .then((res) => setGuests(Array.isArray(res) ? res : res?.items || []))
      .catch(() => setGuests([]));
  }, []);

  const toggle = (id) => setPicked((prev) => ({ ...prev, [id]: !prev[id] }));
  const chosen = (guests || []).filter((g) => picked[g.id]);

  const send = async () => {
    if (chosen.length === 0) return;
    setBusy(true);
    setError("");
    setNote("");
    let sent = 0;
    for (const guest of chosen) {
      const chatId = String(guest.participantId || "").replace("telegram:", "");
      if (!chatId) continue;
      // Erst der Link, dann die Nachricht — so reist genau der Code mit, den der
      // Raum auch wirklich kennt.
      const code = inviteCode();
      onCreate(guest.userName || "Gast", code);
      const text = guestInviteText(roomNumber, callGuestUrl(token, roomNumber, code), guest.userName);
      try {
        const res = await base44.functions.invoke("telegramBot", { action: "send", chatId, text });
        const data = res?.data || {};
        if (data.ok) sent += 1;
        else setError(data.error || "Senden hat nicht geklappt.");
      } catch (e) {
        setError("Senden hat nicht geklappt.");
      }
    }
    setBusy(false);
    setPicked({});
    setNote(`${sent} von ${chosen.length} verschickt`);
  };

  return (
    <div className="rounded-2xl border border-border bg-elevated p-3">
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Aus deinem Telegram</p>
      <p className="mt-1 text-xs text-muted-foreground">
        Ankreuzen und senden — jeder bekommt seinen eigenen Link für Chatraum {roomNumber}.
      </p>

      {guests === null ? (
        <p className="mt-2 text-[11px] text-muted-foreground">Kontakte werden geladen …</p>
      ) : guests.length === 0 ? (
        <p className="mt-2 text-[11px] text-muted-foreground">
          Noch hat niemand deinem Bot geschrieben. Sobald jemand schreibt, taucht er hier auf — dein Bot kann nur Leuten
          schreiben, die ihn schon kennen.
        </p>
      ) : (
        <div className="mt-2 space-y-1.5">
          {guests.map((guest) => (
            <button
              key={guest.id}
              type="button"
              onClick={() => toggle(guest.id)}
              className="w-full flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-left hover:border-primary/50 transition-colors"
            >
              <span
                className={
                  "w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 " +
                  (picked[guest.id] ? "bg-primary border-primary text-primary-foreground" : "border-border")
                }
              >
                {picked[guest.id] && <Check className="w-3 h-3" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-foreground truncate">{guest.userName || "Telegram-Gast"}</span>
                <span className="block text-[10px] text-muted-foreground truncate">{guest.participantName || "Telegram"}</span>
              </span>
            </button>
          ))}

          <button
            type="button"
            onClick={send}
            disabled={busy || chosen.length === 0}
            className="w-full mt-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-40"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            {chosen.length > 1 ? `${chosen.length} Einladungen senden` : "Einladung senden"}
          </button>
        </div>
      )}

      {note && <p className="mt-2 text-[11px] text-primary">{note}</p>}
      {error && <p className="mt-2 text-[11px] text-destructive">{error}</p>}
    </div>
  );
}