// Persönliche Befehle aus der zentralen Eingabe landen hier. Sie gelten nur für
// die eigene Ansicht, sind jederzeit umkehrbar und werden deshalb direkt
// ausgeführt — ohne Bestätigungsdialog.

const KEY = "artanis_ui_command";
const EVENT = "artanis:ui-command";

export function sendUiCommand(action, params = {}) {
  const cmd = { action, params, at: Date.now() };
  try {
    sessionStorage.setItem(KEY, JSON.stringify(cmd));
  } catch (e) {
    /* privater Modus */
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: cmd }));
  return cmd;
}

export function onUiCommand(fn) {
  const handler = (event) => fn(event.detail);
  window.addEventListener(EVENT, handler);
  return () => window.removeEventListener(EVENT, handler);
}

// Ein Befehl, der kurz vor dem Seitenwechsel abgesetzt wurde, wirkt noch nach.
export function takePendingUiCommand(maxAgeMs = 15000) {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const cmd = JSON.parse(raw);
    if (!cmd || Date.now() - cmd.at > maxAgeMs) return null;
    return cmd;
  } catch (e) {
    return null;
  }
}

export function clearUiCommand() {
  try {
    sessionStorage.removeItem(KEY);
  } catch (e) {
    /* ignore */
  }
}