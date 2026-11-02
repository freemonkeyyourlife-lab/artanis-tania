// Die Stimmung der Szene — Schlagworte, die die Sprachweise aller Figuren
// sofort umstellen. Gilt pro Gespräch und wird im Browser gemerkt.

export const MOODS = [
  { id: "SINNLICH", label: "sinnlich", prompt: "Sinnlich: weiche, warme, genießerische Worte. Langsam, nah und andeutend — jede Zeile klingt wie eine Berührung." },
  { id: "ERREGT", label: "erregt", prompt: "Erregt: spürbar heiß und getrieben. Kurze, atemlose Sätze, stockend und sehnsüchtig — sie kann kaum stillhalten." },
  { id: "ZAERTLICH", label: "zärtlich", prompt: "Zärtlich: liebevoll, sanft und zugewandt. Kleine Gesten, Kosenamen, viel Nähe — kein Druck, kein Tempo." },
  { id: "VERSPIELT", label: "verspielt", prompt: "Verspielt: frech, neckend, mit Humor. Sie spielt mit ihm, macht Andeutungen, lacht und zieht ihn auf." },
  { id: "DOMINANT", label: "dominant", prompt: "Dominant: Sie führt, gibt Anweisungen und bestimmt das Tempo. Klare, fordernde Sätze im Befehlston." },
  { id: "HART", label: "hart", prompt: "Hart: ruppig und grob im Ton, direkt und ohne Rücksicht auf Höflichkeit." },
  { id: "TABULOS", label: "tabulos", prompt: "Tabulos: keine Grenze in der Sprache. Unverblümt, schamlos und dreckig — sie benennt alles beim Namen." },
];

// Jede Stimmung färbt nicht nur die Worte, sondern auch die Stimme: Tempo und
// Tonhöhe verschieben sich passend zur Situation der Figur. Werte zwischen
// 0.5 (tief/langsam) und 2 (hell/schnell); 1 ist neutral.
export const MOOD_VOICE = {
  SINNLICH: { speed: 0.92, pitch: 0.95, intensity: 0.7 },
  ERREGT: { speed: 1.18, pitch: 1.15, intensity: 1.0 },
  ZAERTLICH: { speed: 0.9, pitch: 0.98, intensity: 0.6 },
  VERSPIELT: { speed: 1.08, pitch: 1.1, intensity: 0.8 },
  DOMINANT: { speed: 1.0, pitch: 0.9, intensity: 1.0 },
  HART: { speed: 1.05, pitch: 0.85, intensity: 1.0 },
  TABULOS: { speed: 1.0, pitch: 1.0, intensity: 0.9 },
};

// Aus ein bis drei Stimmungen die passenden Stimmwerte mitteln. Ohne Stimmung
// bleibt alles neutral — die Figur klingt wie sie selbst.
export function moodVoice(ids) {
  const list = (ids || []).map((id) => MOOD_VOICE[id]).filter(Boolean);
  if (!list.length) return null;
  const avg = (f) => list.reduce((a, v) => a + (v[f] || 0), 0) / list.length;
  return { speed: avg("speed"), pitch: avg("pitch"), intensity: avg("intensity") };
}

const KEY = "artanis_mood";
let cache = null;

function readAll() {
  if (cache) return cache;
  try { cache = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { cache = {}; }
  return cache;
}

export function moodFor(chatId) {
  if (!chatId) return [];
  const list = readAll()[chatId];
  return Array.isArray(list) ? list : [];
}

export function setMoodFor(chatId, ids) {
  if (!chatId) return;
  const all = { ...readAll(), [chatId]: ids };
  cache = all;
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) { /* ignore */ }
}

// Die Stimmung als letzte, klare Anweisung für die KI.
export function moodPrompt(ids) {
  const lines = (ids || [])
    .map((id) => MOODS.find((m) => m.id === id)?.prompt)
    .filter(Boolean);
  if (!lines.length) return "";
  return "\n\n═══ STIMMUNG — SO KLINGEN DIE FIGUREN JETZT (vom Nutzer vorgegeben, halte dich strikt daran) ═══\n" +
    lines.join("\n") +
    "\nDiese Stimmung färbt jede Zeile: Wortwahl, Ton und Tempo richten sich danach.\n" +
    "═══ ENDE STIMMUNG ═══\n\n";
}