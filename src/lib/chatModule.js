// Die Einstellungen des Chat-Moduls. Sie liegen am Gerät, damit das Modul auch
// allein — ohne die große Plattform — funktioniert.

const KEY = "artanis:chatmodule";

export const CHAT_MODES = {
  AI: "AI",
  MANUAL: "MANUAL",
};

export const CHAT_MODE_LABEL = {
  [CHAT_MODES.AI]: "Chatbot (Modell antwortet)",
  [CHAT_MODES.MANUAL]: "Manuell (keine KI — ich antworte selbst)",
};

export const CHAT_LAYOUTS = {
  BUBBLE: "bubble",
  FULLSCREEN: "fullscreen",
};

export const DEFAULT_CHAT_MODULE = {
  mode: CHAT_MODES.AI,
  layout: CHAT_LAYOUTS.BUBBLE,
  accent: "#e29578",
  radius: 20,
  modelId: "",
  autoSpeak: false,
  voiceName: "",
  mirrorToTelegram: false,
  telegramChatId: "",
};

function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) || "{}");
    return { ...DEFAULT_CHAT_MODULE, ...raw };
  } catch (e) {
    return { ...DEFAULT_CHAT_MODULE };
  }
}

let current = load();
const listeners = new Set();

export const getChatModule = () => current;

export function setChatModule(patch) {
  current = { ...current, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch (e) {
    /* Speicher voll oder gesperrt — die Einstellung gilt trotzdem für diese Sitzung */
  }
  listeners.forEach((fn) => fn(current));
  return current;
}

export function subscribeChatModule(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Wo das Gespräch liegt: mit Telegram-Kennung, wenn gespiegelt wird — dann geht
// jede Nachricht denselben Weg wie ein Telegram-Chat.
export const handleFor = (settings, userId) =>
  settings.mirrorToTelegram && settings.telegramChatId
    ? `telegram:${settings.telegramChatId}`
    : `module:${userId || "gast"}`;