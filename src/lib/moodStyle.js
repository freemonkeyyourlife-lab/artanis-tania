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