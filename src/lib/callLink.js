// Der Call-Link bleibt derselbe, bis der Gastgeber bewusst einen neuen erzeugt.
const KEY = "artanis_call_token";
// Ohne I, O, 0 und 1 — die verwechselt man beim Abtippen.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const LENGTH = 8;

export function newCallCode() {
  const bytes = new Uint8Array(LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

// Egal ob getippt oder aus einem Link kopiert: Schreibweise und Bindestriche sind egal.
export function normalizeCallCode(value) {
  return String(value || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function store(token) {
  try { localStorage.setItem(KEY, token); } catch (e) { /* ignore */ }
  return token;
}

export function getCallToken() {
  let token = null;
  try { token = localStorage.getItem(KEY); } catch (e) { /* ignore */ }
  // Der alte lange Link wird einmalig durch den kurzen Code ersetzt.
  if (!token || token.length !== LENGTH) return store(newCallCode());
  return token;
}

export function resetCallToken() {
  return store(newCallCode());
}