import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';

const API = "https://api.telegram.org";
const WEBHOOK_URL = "https://artanis-tania.base44.app/functions/telegramBot";
const CHANNEL = "TELEGRAM";
const PREFIX = "telegram:";

const readSecret = (name: string) => {
  try {
    return secrets.get(name) || "";
  } catch (e) {
    return "";
  }
};

const tg = async (token: string, method: string, payload?: Record<string, unknown>) => {
  const res = await fetch(`${API}/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {}),
  });
  return res.json();
};

const nameOf = (chat: any) =>
  [chat?.first_name, chat?.last_name].filter(Boolean).join(" ")
  || chat?.title
  || chat?.username
  || "Telegram-Gast";

// Eine Nachricht von außen wird zu einem Gespräch in der App — im selben Aufbau
// wie ein Gast-Chat, damit der Leitstand sie ohne Umwege anzeigt.
async function receive(base44: any, update: any) {
  const msg = update?.message;
  const chat = msg?.chat;
  if (!chat) return;

  const text = String(msg.text || msg.caption || "").trim();
  if (!text) return;

  const chatId = String(chat.id);
  const handle = PREFIX + chatId;
  const name = nameOf(chat);
  const now = new Date().toISOString();

  const found = await base44.asServiceRole.entities.Conversation.filter(
    { participantId: handle },
    "-created_date",
    1,
  );
  let conv = found[0];

  if (conv) {
    await base44.asServiceRole.entities.Conversation.update(conv.id, {
      userName: name,
      lastMessageAt: now,
      lastGuestMessageAt: now,
      waitingSince: now,
      unreadCount: (conv.unreadCount || 0) + 1,
    });
  } else {
    conv = await base44.asServiceRole.entities.Conversation.create({
      userId: handle,
      userName: name,
      participantId: handle,
      participantName: chat.username ? "@" + chat.username : "Telegram",
      creatorName: "Telegram",
      conversationType: "AI",
      lastMessageAt: now,
      lastGuestMessageAt: now,
      waitingSince: now,
      unreadCount: 1,
    });
  }

  await base44.asServiceRole.entities.Message.create({
    conversationId: conv.id,
    sender: name,
    senderType: "HUMAN",
    text,
    channel: CHANNEL,
  });
}

export default async function (req: Request): Promise<Response> {
  const token = readSecret("TELEGRAM_BOT_TOKEN");
  const hookSecret = readSecret("TELEGRAM_WEBHOOK_SECRET");

  // 1) Ruft Telegram an, ist es eine eingehende Nachricht. Dafür gibt es keinen
  //    angemeldeten Nutzer — stattdessen muss das geheime Kennwort stimmen.
  const header = req.headers.get("x-telegram-bot-api-secret-token") || "";
  if (hookSecret && header && header === hookSecret) {
    try {
      const update = await req.json();
      await receive(createClientFromRequest(req), update);
    } catch (e) {
      console.error("telegramBot receive: " + (e && e.message));
    }
    // Telegram erwartet immer ein OK — sonst schickt er dieselbe Nachricht endlos.
    return Response.json({ ok: true });
  }

  // 2) Alles andere ist die Bedienung aus der App — und die darf nur der Besitzer.
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== "admin") {
      return Response.json({ ok: false, error: "Nur für den Besitzer." }, { status: 403 });
    }

    // Ohne Schlüssel bricht nichts — die App sagt dir dann, was fehlt.
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
      const data = await tg(token, "getMe");
      if (!data.ok) {
        return Response.json({ ok: false, error: data.description || "Der Bot antwortet nicht." });
      }
      const hook = await tg(token, "getWebhookInfo");
      return Response.json({ ok: true, bot: data.result, receiving: Boolean(hook.result?.url) });
    }

    if (action === "receive-on") {
      if (!hookSecret) {
        return Response.json({ ok: false, error: "Das Kennwort für den Empfang fehlt." });
      }
      const data = await tg(token, "setWebhook", {
        url: WEBHOOK_URL,
        secret_token: hookSecret,
        allowed_updates: ["message"],
      });
      if (!data.ok) {
        return Response.json({ ok: false, error: data.description || "Einschalten hat nicht geklappt." });
      }
      return Response.json({ ok: true, receiving: true });
    }

    if (action === "receive-off") {
      const data = await tg(token, "deleteWebhook");
      if (!data.ok) {
        return Response.json({ ok: false, error: data.description || "Ausschalten hat nicht geklappt." });
      }
      return Response.json({ ok: true, receiving: false });
    }

    if (action === "discover") {
      const seen = new Map();
      const updates = await tg(token, "getUpdates");
      for (const update of updates.result || []) {
        const chat = update.message?.chat || update.channel_post?.chat;
        if (!chat) continue;
        seen.set(String(chat.id), {
          chatId: String(chat.id),
          name: nameOf(chat),
          username: chat.username || "",
        });
      }
      // Wer schon geschrieben hat, steht ohnehin in der App — auch wenn der
      // Empfang läuft und Telegram die Abfrage deshalb verweigert.
      const convs = await base44.asServiceRole.entities.Conversation.filter(
        { conversationType: "AI" },
        "-lastMessageAt",
        60,
      );
      for (const c of convs) {
        const handle = String(c.participantId || "");
        if (!handle.startsWith(PREFIX)) continue;
        const chatId = handle.slice(PREFIX.length);
        if (seen.has(chatId)) continue;
        seen.set(chatId, {
          chatId,
          name: c.userName || "Gast",
          username: String(c.participantName || "").replace("@", ""),
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
      const data = await tg(token, "sendMessage", { chat_id: chatId, text });
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