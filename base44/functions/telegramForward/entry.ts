import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

const API = "https://api.telegram.org";
const PREFIX = "telegram:";
const CHANNEL = "TELEGRAM";

// Wird vom Ablauf „Telegram-Antwort" aufgerufen: was in der App geschrieben
// wird, geht denselben Weg zurück aufs Handy des Kunden.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const messageId = String(body.messageId || body.entity_id || "");
    if (!messageId) return Response.json({ ok: true, skipped: "keine Nachricht" });

    const msg = await base44.asServiceRole.entities.Message.get(messageId);
    if (!msg || !msg.text) return Response.json({ ok: true, skipped: "leer" });
    // Was selbst von Telegram kam, darf nicht zurückwandern.
    if (msg.channel === CHANNEL) return Response.json({ ok: true, skipped: "von Telegram" });

    const conv = await base44.asServiceRole.entities.Conversation.get(msg.conversationId);
    const handle = String(conv?.participantId || "");
    if (!handle.startsWith(PREFIX)) return Response.json({ ok: true, skipped: "kein Telegram-Chat" });

    let token = "";
    try {
      token = secrets.get("TELEGRAM_BOT_TOKEN") || "";
    } catch (e) {
      token = "";
    }
    if (!token) return Response.json({ ok: true, skipped: "kein Schlüssel" });

    const res = await fetch(`${API}/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: handle.slice(PREFIX.length), text: msg.text }),
    });
    const data = await res.json();
    if (!data.ok) {
      console.error("telegramForward: " + (data.description || "unbekannt"));
      return Response.json({ ok: false, error: data.description || "Senden hat nicht geklappt." });
    }
    return Response.json({ ok: true, sentTo: handle });
  } catch (error) {
    console.error("telegramForward error: " + (error && error.message));
    return Response.json({ ok: false, error: error && error.message }, { status: 500 });
  }
}