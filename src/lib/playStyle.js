// Wie heftig die Szene gerade läuft — vier Stufen von Runterkommen bis Vollgas.
// Gilt pro Gespräch und wird im Browser gemerkt.

export const PLAY_LEVELS = [
  { id: "SANFT", label: "Runterkommen", hint: "ruhig, nah, knapp" },
  { id: "NORMAL", label: "Normal", hint: "so wie immer" },
  { id: "MEHR", label: "Mehr Gas", hint: "deutlicher, ausführlicher" },
  { id: "VOLLGAS", label: "Vollgas", hint: "energisch, direkt, lang" },
];

const PROMPTS = {
  SANFT:
    "═══ TEMPO — RUNTERKOMMEN ═══\n" +
    "Bleib ruhig, nah und zugewandt. Wenig Text, keine Zuspitzung, nichts treiben. Sprich leise und ehrlich, hör zu, lass die Szene atmen. Setz keine neuen Reize drauf.\n" +
    "═══ ENDE TEMPO ═══\n\n",
  MEHR:
    "═══ TEMPO — MEHR GAS ═══\n" +
    "Zieh das Tempo an: deutlicher, fordernder, ausführlicher als sonst. Mehr Details, mehr Körper, mehr Direktheit. Trau dich weiter und mach die Szene spürbar heißer — bleib aber bei dem, was er vorgibt.\n" +
    "═══ ENDE TEMPO ═══\n\n",
  VOLLGAS:
    "═══ TEMPO — VOLLGAS ═══\n" +
    "Gib alles: energisch, direkt, unverblümt und deutlich ausführlicher als sonst. Mehr Sätze, mehr Bilder, mehr Handlung, mehr Spannung — triebhaft und fordernd, ohne zu bremsen. Nimm dir Raum und lass ihn nicht kalt werden.\n" +
    "═══ ENDE TEMPO ═══\n\n",
};

export const playPrompt = (id) => PROMPTS[id] || "";

const KEY = "artanis_play_level";
let cache = null;

function readAll() {
  if (cache) return cache;
  try { cache = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { cache = {}; }
  return cache;
}

export function playLevelFor(chatId) {
  if (!chatId) return "NORMAL";
  return readAll()[chatId] || "NORMAL";
}

export function setPlayLevelFor(chatId, level) {
  if (!chatId) return;
  const all = { ...readAll(), [chatId]: level };
  cache = all;
  try { localStorage.setItem(KEY, JSON.stringify(all)); } catch (e) { /* ignore */ }
}