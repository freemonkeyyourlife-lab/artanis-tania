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

// Merkt sich den Code auch dann, wenn der Browser keinen Speicher freigibt —
// sonst bekäme jeder Seitenaufruf einen neuen Raum.
let cached = null;

function store(token) {
  cached = token;
  try { localStorage.setItem(KEY, token); } catch (e) { /* ignore */ }
  return token;
}

export function getCallToken() {
  if (cached) return cached;
  let token = null;
  try { token = localStorage.getItem(KEY); } catch (e) { /* ignore */ }
  // Der alte lange Link wird einmalig durch den kurzen Code ersetzt.
  if (!token || token.length !== LENGTH) return store(newCallCode());
  cached = token;
  return token;
}

// Die Adresse für den Einladungslink. In der Vorschau zeigt die Adresszeile auf
// die Vorschau — ein Link daraus führt Gäste woanders hin als in deinen Raum.
const PUBLISHED = "https://artanis-triania-live.base44.app";

export function callInviteUrl(token, roomNumber) {
  const base = window.self !== window.top ? PUBLISHED : window.location.origin;
  // Die Raumnummer reist im Link mit — beide Seiten sehen dieselbe.
  return `${base}/call/${token}${roomNumber ? `?r=${roomNumber}` : ""}`;
}

// Der persönliche Gäste-Link: derselbe Raum, aber mit der eigenen Eintrittskarte.
// Nur er öffnet einen geschlossenen Raum — und nur für den, der ihn bekommt.
export function callGuestUrl(token, roomNumber, guestToken) {
  const url = callInviteUrl(token, roomNumber);
  return `${url}${url.includes("?") ? "&" : "?"}g=${guestToken}`;
}

// Die Einladung als fertiger Text — gleich, ob sie per Link, Bot oder Teilen rausgeht.
export function callInviteText(token, roomNumber) {
  return `ARTANIS × TRIANIA — Chatraum ${roomNumber}.\nKomm rein: ${callInviteUrl(token, roomNumber)}`;
}

export function resetCallToken() {
  return store(newCallCode());
}