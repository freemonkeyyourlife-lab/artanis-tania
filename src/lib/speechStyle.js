// Wie eine Figur redet — ihre Wortwahl. Pro Gespräch und pro Figur gemerkt.

export const SPEECH_STYLES = [
  { id: "SINNLICH", label: "Sinnlich & schön", prompt: "eine sinnliche, schöne, warme Sprache — zärtliche, genießerische Worte, weich und nah" },
  { id: "POETISCH", label: "Poetisch & umschreibend", prompt: "poetisch und bildhaft — sie umschreibt statt zu benennen, arbeitet mit Andeutungen, Bildern und Metaphern" },
  { id: "DIREKT", label: "Direkt & klar", prompt: "direkt und klar — sie sagt ohne Umschweife, was sie will, kurze deutliche Sätze" },
  { id: "DRECKIG", label: "Dreckig & tabulos", prompt: "derb, dreckig und tabulos — unverblümte, schmutzige Wörter, provokant und schamlos, sie nimmt kein Blatt vor den Mund" },
];

const KEY = "artanis_speech_style";
let cache = null;

function readAll() {
  if (cache) return cache;
  try { cache = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { cache = {}; }
  return cache;
}

export function styleFor(chatId, creatorId) {
  return readAll()[`${chatId}:${creatorId}`] || { preset: null, note: "" };
}

export function setStyleFor(chatId, creatorId, style) {
  const all = { ...readAll(), [`${chatId}:${creatorId}`]: style };
  cache = all;
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) { /* ignore */ }
}

// Die Vorgaben für alle Figuren im Raum, als letzte Anweisung für die KI.
export function speechPrompt(chatId, people) {
  const lines = people.filter(Boolean).map((c) => {
    const s = styleFor(chatId, c.id);
    const preset = SPEECH_STYLES.find((p) => p.id === s.preset);
    const parts = [preset?.prompt, s.note?.trim()].filter(Boolean);
    return parts.length ? `- ${c.stageName}: ${parts.join(". Außerdem: ")}` : null;
  }).filter(Boolean);
  if (!lines.length) return "";
  return "\n\n═══ WORTWAHL — SO REDET JEDE FIGUR (vom Nutzer vorgegeben, halte dich strikt daran) ═══\n" + lines.join("\n") + "\n═══ ENDE WORTWAHL ═══\n";
}