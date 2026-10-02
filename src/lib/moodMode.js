// Der Stimmungs-Modus merkt sich, was beim nächsten Erlebnis gelten soll.
// Sobald ein Gespräch aufgeht, wird es darauf angewendet und verbraucht.

const KEY = "artanis_pending_mood";
const NOTE_KEY = "artanis_scene_note";

function read(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}");
  } catch (e) {
    return {};
  }
}

function write(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    /* Speicher verweigert. */
  }
}

export function setPendingMood(data) {
  write(KEY, data || {});
}

export function peekPendingMood() {
  return read(KEY);
}

export function clearPendingMood() {
  write(KEY, {});
}

// Einmal lesen und dabei leeren — es gilt für genau ein Erlebnis.
export function takePendingMood() {
  const data = read(KEY);
  if (Object.keys(data).length) write(KEY, {});
  return data;
}

export function setSceneNote(chatId, note) {
  if (!chatId) return;
  const all = read(NOTE_KEY);
  all[chatId] = note || "";
  write(NOTE_KEY, all);
}

export function sceneNoteFor(chatId) {
  return chatId ? read(NOTE_KEY)[chatId] || "" : "";
}

// Die Szenen-Vorgabe als Anweisung für die KI.
export function sceneNotePrompt(chatId) {
  const note = sceneNoteFor(chatId);
  if (!note) return "";
  return (
    "\n\n═══ SZENE — SO IST DAS ERLEBNIS EINGESTELLT (vom Nutzer vorgegeben) ═══\n" +
    note +
    "\nHalte dich an Ort, Licht, Nähe und Ton. Baue die Szene danach auf.\n" +
    "═══ ENDE SZENE ═══\n\n"
  );
}