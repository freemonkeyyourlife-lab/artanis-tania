import { newCallCode, getCallToken } from "@/lib/callLink";

// Die Chaträume des Gastgebers: Chatraum 1 ist der bestehende Code, jeder
// weitere bekommt eine eigene Nummer und einen eigenen Code. Die Nummer steht
// im Link — so landet niemand im falschen Raum.
const KEY = "artanis_call_rooms";
let cache = null;

function read() {
  if (cache) return cache;
  let list = null;
  try { list = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { list = null; }
  cache = Array.isArray(list) ? list.filter((r) => r && r.token) : [];
  return cache;
}

function write(list) {
  cache = list;
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch (e) { /* ignore */ }
  return list;
}

export function getRooms() {
  const list = read();
  if (list.length) return list;
  return write([{ number: 1, token: getCallToken() }]);
}

// Ein neuer Raum — die nächste freie Nummer.
export function addRoom() {
  const list = getRooms();
  return write([...list, { number: list.length + 1, token: newCallCode() }]).slice(-1)[0];
}