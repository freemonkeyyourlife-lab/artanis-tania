import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

const API = "https://api.telegram.org";

// Automatisches Senden über Telegram — der einzige der drei Kanäle, der von
// außen wirklich Nachrichten verschicken darf. Läuft über deinen eigenen Bot.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ ok: false, error: "Nur für den Besitzer." }, { status: 403 });
    }

    // Ohne Schlüssel bricht nichts — die App sagt dir dann, was fehlt.
    let token = "";
    try {
      token = secrets.get("TELEGRAM_BOT_TOKEN") || "";
    } catch (e) {
      token = "";
    }
    if (!token) {
      return Response.json({
        ok: false,
        missingKey: true,
        error: "Noch kein Bot-Schlüssel hinterlegt.",
      });
    }

    const body = await req.json().catch(() => ({}));
    const action = body.action || "status";

    if (action === "status") {
      const res = await fetch(`${API}/bot${token}/getMe`);
      const data = await res.json();
      if (!data.ok) {
        return Response.json({ ok: false, error: data.description || "Der Bot antwortet nicht." });
      }
      return Response.json({ ok: true, bot: data.result });
    }

    if (action === "discover") {
      const res = await fetch(`${API}/bot${token}/getUpdates`);
      const data = await res.json();
      if (!data.ok) {
        return Response.json({ ok: false, error: data.description || "Der Bot antwortet nicht." });
      }
      const seen = new Map();
      for (const update of data.result || []) {
        const chat = update.message?.chat || update.channel_post?.chat;
        if (!chat) continue;
        const name = [chat.first_name, chat.last_name].filter(Boolean).join(" ")
          || chat.title
          || chat.username
          || "Unbekannt";
        seen.set(String(chat.id), {
          chatId: String(chat.id),
          name,
          username: chat.username || "",
        });
      }
      return Response.json({ ok: true, chats: Array.from(seen.values()) });
    }

    if (action === "send") {
      const chatId = String(body.chatId || "").trim();
      const text = String(body.text || "").trim();
      if (!chatId || !text) {
        return Response.json({ ok: false, error: "Empfänger und Text fehlen." });
      }
      const res = await fetch(`${API}/bot${token}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text }),
      });
      const data = await res.json();
      if (!data.ok) {
        return Response.json({ ok: false, error: data.description || "Senden hat nicht geklappt." });
      }
      return Response.json({ ok: true, sentTo: chatId });
    }

    return Response.json({ ok: false, error: "Unbekannte Aktion." });
  } catch (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }
}