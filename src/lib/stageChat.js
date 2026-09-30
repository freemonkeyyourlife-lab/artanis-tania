import { base44 } from "@/api/base44Client";
import { PERSONA_MODES } from "@/lib/personaPrompts";

// Der gemeinsame Plattform-Chat im Video-Call. Die echte Unterhaltung bleibt die
// einzige Quelle — der Call spiegelt sie nur, damit alle dasselbe lesen.
const MARKERS = /\[(SEND_IMAGE|SEND_VIDEO|SEND_VOICE|SEND_PPV|SUGGEST|CHARACTER)\s*:[^\]]*\]/gi;

// Im Call zählt der lesbare Text — Medien und Knöpfe bleiben im normalen Chat.
export const cleanStageText = (text) =>
  String(text || "").replace(MARKERS, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

export function lineFromMessage(msg) {
  return {
    id: String(msg?.id || ""),
    sender: msg?.sender || (msg?.senderType === "AI" ? "Charakter" : "Gast"),
    senderType: msg?.senderType === "AI" ? "AI" : msg?.senderType === "SYSTEM" ? "SYSTEM" : "HUMAN",
    text: cleanStageText(msg?.text).slice(0, 4000),
  };
}

export const stageTitle = (conversation) =>
  conversation?.creatorName || conversation?.participantName || conversation?.userName || "Plattform-Chat";

const personaKey = (creator) =>
  creator?.personaType === "SOLO_MALE" ? "artanis"
    : creator?.personaType === "COUPLE" || creator?.personaType === "GROUP" ? "couple"
      : "triania";

const STAGE_RULES =
  "\n\n═══ IM VIDEO-CALL ═══\n" +
  "Mehrere Leute schauen dir gerade live zu und schreiben dir abwechselnd. Antworte auf Deutsch, in der Du-Form, natürlich und locker.\n" +
  "Halte dich KURZ: 2–4 Sätze, höchstens ein kurzer Absatz. Keine Aufzählungen, keine Regieanweisungen in Klammern, keine Marker wie [SEND_IMAGE] oder [SUGGEST].\n" +
  "Stelle höchstens eine Frage und bleib im Gespräch.\n" +
  "═══ ENDE ═══\n";

// Die Antwort der Figur — dieselbe Persönlichkeit wie im normalen Chat, nur ohne
// Bilder und Knöpfe, weil hier alle gemeinsam mitlesen.
export async function generateStageReply({ conversation, creator, history }) {
  const persona = PERSONA_MODES[personaKey(creator)] || PERSONA_MODES.triania;
  let system = persona.prompt + STAGE_RULES;
  if (creator?.personaPrompt) system += "\n\n" + creator.personaPrompt;
  const name = creator?.stageName;
  if (name && !["Artanis", "Triania", "Artanis × Triania"].includes(name)) {
    system += `\n\nWICHTIG: Dein Name ist ${name} — nicht Triania, nicht Artanis. ${creator?.bio || ""}`;
  }
  const turns = (history || [])
    .slice(-12)
    .map((m) => `${m.senderType === "HUMAN" ? "User" : "Du"}: ${m.text}`)
    .join("\n");
  const res = await base44.integrations.Core.InvokeLLM({
    prompt: system + (turns ? "\n\nBISHERIGES GESPRÄCH:\n" + turns : "") + "\n\nAntworte jetzt.",
  });
  const raw = typeof res === "string" ? res : (res?.response || res?.text || res?.output || "");
  return cleanStageText(raw).slice(0, 4000);
}

// Die Chats, die im Call auf die Bühne können: die Charakter-Chats der Plattform
// und die eigenen Direktnachrichten.
export async function loadStageChoices(userId) {
  const [ai, human] = await Promise.all([
    base44.entities.Conversation.filter({ conversationType: "AI" }, "-lastMessageAt", 40).catch(() => []),
    userId
      ? base44.entities.Conversation.filter({ conversationType: "HUMAN", participantId: userId }, "-lastMessageAt", 20).catch(() => [])
      : Promise.resolve([]),
  ]);
  return [...human, ...ai];
}