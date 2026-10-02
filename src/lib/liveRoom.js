import { base44 } from "@/api/base44Client";

// Es gibt genau einen Live-Raum — den des Gastgebers. Der Raum-Link steckt im Token.
export async function setLiveState(token, hostName, isLive) {
  const existing = await base44.entities.LiveRoom.filter({ token });
  const data = {
    token,
    hostName: hostName || "Gastgeber",
    isLive,
    startedAt: isLive ? new Date().toISOString() : null,
  };
  if (existing[0]) return base44.entities.LiveRoom.update(existing[0].id, data);
  return base44.entities.LiveRoom.create(data);
}

// Kurz merken, was zuletzt galt — dann muss der Hinweis nicht bei jedem
// Seitenaufbau erneut fragen. Änderungen kommen über die Live-Verbindung.
const CACHE_KEY = "liveRoomCache";
const SKIP_KEY = "liveRoomSkipUntil";
const CACHE_MS = 30000;
const REST_MS = 60000;

const readJson = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch (e) {
    return null;
  }
};

const write = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    /* ohne Speicher geht es auch weiter */
  }
};

export async function fetchLiveRoom() {
  const cached = readJson(CACHE_KEY);

  // Die App hatte gerade zu viele Anfragen laufen — so lange bleibt es ruhig.
  if (Date.now() < Number(readJson(SKIP_KEY) || 0)) return cached?.room || null;
  if (cached && Date.now() - Number(cached.at || 0) < CACHE_MS) return cached.room || null;

  try {
    const res = await base44.entities.LiveRoom.list("-updated_date", 1);
    const room = (Array.isArray(res) ? res[0] : res?.items?.[0]) || null;
    write(CACHE_KEY, { at: Date.now(), room });
    return room;
  } catch (error) {
    // Zu viele Anfragen: kurz Pause machen und den letzten Stand zeigen.
    if (/rate limit/i.test(error?.message || "")) write(SKIP_KEY, Date.now() + REST_MS);
    return cached?.room || null;
  }
}