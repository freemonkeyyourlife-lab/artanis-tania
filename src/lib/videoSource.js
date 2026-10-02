// Die gemerkte Videoquelle: eine externe Kamera, das Handy oder die eingebaute.
// Einmal gewählt, startet jeder neue Call direkt mit dieser Kamera.
const KEY = "artanis_video_source";

export function readPreferredCamera() {
  try { return localStorage.getItem(KEY) || ""; } catch (e) { return ""; }
}

export function savePreferredCamera(deviceId) {
  try {
    if (deviceId) localStorage.setItem(KEY, deviceId);
    else localStorage.removeItem(KEY);
  } catch (e) { /* dann eben ohne Merken */ }
}

// Welche Sitzung schon gefragt wurde. Bleibt im Speicher der laufenden Seite:
// ein frischer Start fragt, die Rückkehr in denselben Call nicht mehr.
const asked = new Set();

export function markSourceAsked(sessionKey) {
  if (sessionKey) asked.add(String(sessionKey));
}

export function sourceAlreadyAsked(sessionKey) {
  return asked.has(String(sessionKey));
}

// Dasselbe Gerät, zweite Kamera: das Handy tritt dem Raum bei und liefert sein Bild.
export function phoneCameraUrl(token, roomNumber) {
  return `${callBase()}/call/${token}${roomNumber ? `?r=${roomNumber}` : ""}`;
}

function callBase() {
  try {
    return window.self !== window.top ? "https://artanis-triania-live.base44.app" : window.location.origin;
  } catch (e) {
    return window.location.origin;
  }
}