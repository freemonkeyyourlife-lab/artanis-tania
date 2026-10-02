// Den ganzen Chat als Datei — mit allen Medien-Verweisen, damit nichts verloren geht.
import { downloadText } from "@/lib/storyExport";

const clean = (s) => String(s || "chat").replace(/[^\wäöüÄÖÜß-]+/g, "_").slice(0, 60);

const mediaLine = (it) => {
  if (it.type === "audio") return `   Sprachnachricht: ${it.url || ""}`;
  if (it.type === "video") return `   Video: ${it.url || ""}`;
  if (it.type === "reshoot") return `   (nicht gezeigt: ${it.note || ""})`;
  return `   Bild${it.locked ? " (verschlossen)" : ""}: ${it.url || ""}`;
};

export function downloadChat(conversation, messages = []) {
  const who = conversation.userName || "Gast";
  const other = conversation.creatorName || conversation.participantName || "Chat";
  const lines = [
    "ARTANIS × TRIANIA — CHAT-ARCHIV",
    "",
    `Gast: ${who}`,
    `Mit: ${other}`,
    `Art: ${conversation.conversationType === "HUMAN" ? "Direktchat" : "KI-Chat"}`,
    `Nachrichten: ${messages.length}`,
    "",
  ];

  messages.forEach((m) => {
    const when = m.created_date ? new Date(m.created_date).toLocaleString("de-DE") : "";
    lines.push(`[${when}] ${m.senderType === "HUMAN" ? who : m.sender || "KI"}: ${m.text || ""}`);
    const items = m.attachments?.length ? m.attachments : m.attachment ? [{ type: "image", url: m.attachment }] : [];
    items.forEach((it) => lines.push(mediaLine(it)));
  });

  downloadText(`chat_${clean(who)}_${clean(other)}.txt`, lines.join("\n"));
}