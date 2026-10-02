import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { secrets } from 'base44:runtime';
import { synthesize, sendVoice, sendAudio } from '../../shared/voiceNote.ts';

const API = "https://api.telegram.org";
const PREFIX = "telegram:";
const CHANNEL = "TELEGRAM";

const readSecret = (name: string) => {
  try {
    return secrets.get(name) || "";
  } catch (e) {
    return "";
  }
};

// Text nach Telegram — auch als Notnagel, wenn die Stimme nicht rausgeht.
const sendText = async (token: string, chatId: string, text: string) => {
  const res = await fetch(`${API}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text }),
  });
  return res.json();
};

// Die im Chat gewählte Stimme sprechen lassen und nach Telegram schicken.
async function sendSpoken(base44: any, token: string, chatId: string, conv: any, text: string) {
  const voiceId = String(conv?.voiceProfileId || "");
  if (!voiceId) throw new Error("Für diesen Chat ist noch keine Stimme gewählt.");

  const voice = await base44.asServiceRole.entities.Voice.get(voiceId);
  if (!voice || voice.provider !== "ELEVENLABS" || !voice.externalVoiceId) {
    throw new Error("Diese Stimme kann nicht frei sprechen.");
  }

  const key = readSecret("ELEVENLABS_API_KEY");
  if (!key) throw new Error("Kein ElevenLabs-Schlüssel hinterlegt.");

  const spoken = {
    key,
    voiceId: voice.externalVoiceId,
    text,
    mood: voice.mood,
    intensity: voice.intensity,
    ending: voice.ending,
    speed: voice.speed,
  };

  // Erst als echte Sprachnachricht mit Wellenform — nimmt Telegram das Format
  // nicht an, geht dieselbe Stimme als Audiodatei raus.
  try {
    const bytes = await synthesize({ ...spoken, format: "opus_48000_64" });
    const data = await sendVoice({ token, chatId, bytes });
    if (data.ok) return true;
    console.error("telegramForward sendVoice: " + (data.description || "unbekannt"));
  } catch (error) {
    console.error("telegramForward opus: " + (error && error.message));
  }

  const mp3 = await synthesize({ ...spoken, format: "mp3_44100_128" });
  const fallback = await sendAudio({ token, chatId, bytes: mp3, title: conv.creatorName || "Sprachnachricht" });
  if (!fallback.ok) throw new Error(fallback.description || "Senden hat nicht geklappt.");
  return true;
}

// Wird vom Ablauf „Telegram-Antwort" aufgerufen: was in der App geschrieben
// wird, geht denselben Weg zurück aufs Handy des Kunden.
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const messageId = String(body.messageId || body.entity_id || "");
    if (!messageId) return Response.json({ ok: true, skipped: "keine Nachricht" });

    const msg = await base44.asServiceRole.entities.Message.get(messageId);
    if (!msg) return Response.json({ ok: true, skipped: "leer" });
    // Selbst eingesprochen und schon in die Charakter-Stimme umgewandelt: dann
    // geht genau diese Aufnahme raus, statt den Text neu sprechen zu lassen.
    const ownVoice = (msg.attachments || []).find((a: any) => a?.type === "audio" && (a.file_uri || a.url));
    if (!msg.text && !ownVoice) return Response.json({ ok: true, skipped: "leer" });
    // Was selbst von Telegram kam, darf nicht zurückwandern.
    if (msg.channel === CHANNEL) return Response.json({ ok: true, skipped: "von Telegram" });

    const conv = await base44.asServiceRole.entities.Conversation.get(msg.conversationId);
    const handle = String(conv?.participantId || "");
    if (!handle.startsWith(PREFIX)) return Response.json({ ok: true, skipped: "kein Telegram-Chat" });

    const token = readSecret("TELEGRAM_BOT_TOKEN");
    if (!token) return Response.json({ ok: true, skipped: "kein Schlüssel" });

    const chatId = handle.slice(PREFIX.length);
    // Der Chat steht auf Stimme — oder du hast von Hand eine Sprachnachricht
    // geschickt. Dann geht die Stimme raus, der Text nur ab und zu.
    const withVoice = conv.voiceNotes === true || msg.voiceNote === true;
    const willSpeak = withVoice && Boolean(msg.text);

    // Jede dritte Nachricht kommt der Text mit — sonst bleibt er weg.
    const sentCount = willSpeak
      ? await base44.asServiceRole.entities.Message.count({ conversationId: msg.conversationId })
      : 0;
    let textSent = false;
    if (msg.text && (!willSpeak || sentCount % 3 === 0)) {
      const data = await sendText(token, chatId, msg.text);
      if (!data.ok) {
        console.error("telegramForward: " + (data.description || "unbekannt"));
        return Response.json({ ok: false, error: data.description || "Senden hat nicht geklappt." });
      }
      textSent = true;
    }

    // Deine eigene Aufnahme, schon umgewandelt — sie klingt wie der Charakter.
    if (ownVoice) {
      try {
        let url = String(ownVoice.url || "");
        if (ownVoice.file_uri) {
          const signed = await base44.asServiceRole.integrations.Core.CreateFileSignedUrl({ file_uri: ownVoice.file_uri, expires_in: 900 });
          url = signed?.signed_url || url;
        }
        const res = await fetch(url);
        if (res.ok) {
          const bytes = new Uint8Array(await res.arrayBuffer());
          const data = await sendVoice({ token, chatId, bytes });
          if (data.ok) return Response.json({ ok: true, sentTo: handle, ownVoice: true });
          console.error("telegramForward eigene Aufnahme: " + (data.description || "unbekannt"));
          const fallback = await sendAudio({ token, chatId, bytes, title: conv?.creatorName || "Sprachnachricht" });
          if (fallback.ok) return Response.json({ ok: true, sentTo: handle, ownVoice: true });
          return Response.json({ ok: false, error: fallback.description || "Senden hat nicht geklappt." });
        }
        console.error("telegramForward eigene Aufnahme nicht lesbar");
      } catch (error) {
        console.error("telegramForward eigene Aufnahme: " + (error && error.message));
      }
    }

    let spoken = false;
    let voiceError = "";
    if (willSpeak) {
      try {
        spoken = await sendSpoken(base44, token, chatId, conv, msg.text);
      } catch (error) {
        voiceError = error && error.message;
        console.error("telegramForward voice: " + voiceError);
      }
      // Geht die Stimme nicht raus, kommt wenigstens der Text an.
      if (!spoken && !textSent && msg.text) {
        await sendText(token, chatId, msg.text);
      }
    }

    return Response.json({ ok: true, sentTo: handle, spoken, voiceError });
  } catch (error) {
    console.error("telegramForward error: " + (error && error.message));
    return Response.json({ ok: false, error: error && error.message }, { status: 500 });
  }
}