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

// Der erkannte Klang — Tempo, Tonlage, Intensität und Stimmung der Stimme.
// Er überlagert die hinterlegte Stimme, sobald das Erlebnis aufgeht.
const VOICE_KEY = "artanis_mood_voice";

export function setVoiceOverride(chatId, voice) {
  if (!chatId) return;
  const all = read(VOICE_KEY);
  if (voice && Object.keys(voice).length) all[chatId] = voice;
  else delete all[chatId];
  write(VOICE_KEY, all);
}

export function voiceOverrideFor(chatId) {
  return chatId ? read(VOICE_KEY)[chatId] || null : null;
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