// Persönliche Fenster-Anordnung des Video-Calls. Das ist ausdrücklich NUR die
// eigene Ansicht: Ausblenden entfernt nichts, und nichts davon gilt für andere.

const KEY = "artanis_call_windows";
const EVENT = "artanis:call-windows";

export const WINDOW_DEFS = [
  { id: "chat", title: "Raum-Chat", hint: "Alle im Call" },
  { id: "guests", title: "Gäste", hint: "Persönliche Einladungslinks" },
  { id: "bot", title: "Bot 1", hint: "Ein Telegram-Gast" },
  { id: "bot2", title: "Bot 2", hint: "Ein zweiter Gast" },
  { id: "share", title: "Teilen", hint: "Links und Einladungen" },
];

export const MIN_TEXT = 11;
export const MAX_TEXT = 17;

const DEFAULTS = {
  order: WINDOW_DEFS.map((w) => w.id),
  open: ["chat"],
  minimized: [],
  dock: "right",
  textSize: 13,
};

let cache = null;
let listeners = [];

function read() {
  if (cache) return cache;
  let stored = null;
  try {
    stored = JSON.parse(localStorage.getItem(KEY) || "null");
  } catch (e) {
    stored = null;
  }
  const ids = WINDOW_DEFS.map((w) => w.id);
  const order = Array.isArray(stored?.order) ? stored.order.filter((id) => ids.includes(id)) : [];
  cache = {
    order: [...order, ...ids.filter((id) => !order.includes(id))],
    open: Array.isArray(stored?.open) ? stored.open.filter((id) => ids.includes(id)) : [...DEFAULTS.open],
    minimized: Array.isArray(stored?.minimized) ? stored.minimized.filter((id) => ids.includes(id)) : [],
    dock: stored?.dock === "left" ? "left" : "right",
    textSize: Number(stored?.textSize) || DEFAULTS.textSize,
  };
  return cache;
}

function write(next) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch (e) {
    /* privater Modus — dann gilt es nur für diese Sitzung */
  }
  listeners.forEach((fn) => fn());
  return cache;
}

export const subscribeWindows = (fn) => {
  listeners.push(fn);
  return () => {
    listeners = listeners.filter((x) => x !== fn);
  };
};

export const loadWindows = () => read();

export const openWindow = (id) => write({ ...read(), open: read().open.includes(id) ? read().open : [...read().open, id], minimized: read().minimized.filter((m) => m !== id) });

export const closeWindow = (id) => write({ ...read(), open: read().open.filter((o) => o !== id), minimized: read().minimized.filter((m) => m !== id) });

export const toggleWindow = (id) => (read().open.includes(id) ? closeWindow(id) : openWindow(id));

export const toggleMinimize = (id) => {
  const current = read();
  return write({ ...current, minimized: current.minimized.includes(id) ? current.minimized.filter((m) => m !== id) : [...current.minimized, id] });
};

// Fenster im Stapel nach oben oder unten schieben — Tastatur- und Touch-freundlich.
export const moveWindow = (id, direction) => {
  const current = read();
  const order = [...current.order];
  const at = order.indexOf(id);
  const to = at + (direction === "up" ? -1 : 1);
  if (at < 0 || to < 0 || to >= order.length) return current;
  [order[at], order[to]] = [order[to], order[at]];
  return write({ ...current, order });
};

export const setDock = (dock) => write({ ...read(), dock: dock === "left" ? "left" : "right" });

export const setTextSize = (size) => {
  const next = Math.min(MAX_TEXT, Math.max(MIN_TEXT, Number(size) || DEFAULTS.textSize));
  return write({ ...read(), textSize: next });
};

export const resetWindows = () => write({ ...DEFAULTS, order: [...DEFAULTS.order], open: [...DEFAULTS.open], minimized: [] });