// Globales Design-Theme für die ganze Seite: Schrift, Zeilenabstand und
// Akzentfarbe. Gespeichert in der DesignTheme-Entität (Admin schreibt, alle
// lesen), sodass Änderungen für alle Besucher gelten. Lokaler Cache verhindert
// ein Flackern beim Laden.

import { base44 } from "@/api/base44Client";
import { applyFont, FONTS } from "@/lib/appFont";

const LS_KEY = "app-theme-cache";

export const DEFAULT_THEME = {
  font: "Montserrat",
  lineHeight: 1.6,
  accentH: 16,
  accentS: 65,
  accentL: 68,
};

const num = (v, d) => (typeof v === "number" && !isNaN(v) ? v : d);

export function normalizeTheme(t) {
  const font = t && t.font && FONTS.some((f) => f.value === t.font) ? t.font : DEFAULT_THEME.font;
  return {
    font,
    lineHeight: num(t && t.lineHeight, DEFAULT_THEME.lineHeight),
    accentH: num(t && t.accentH, DEFAULT_THEME.accentH),
    accentS: num(t && t.accentS, DEFAULT_THEME.accentS),
    accentL: num(t && t.accentL, DEFAULT_THEME.accentL),
  };
}

export function applyTheme(t) {
  const th = normalizeTheme(t || DEFAULT_THEME);
  const root = document.documentElement;
  applyFont(th.font);
  document.body.style.lineHeight = String(th.lineHeight);
  root.style.setProperty("--app-line-height", String(th.lineHeight));
  const accent = `${th.accentH} ${th.accentS}% ${th.accentL}%`;
  root.style.setProperty("--primary", accent);
  root.style.setProperty("--accent", accent);
  root.style.setProperty("--ring", accent);
  root.style.setProperty("--sidebar-primary", accent);
  root.style.setProperty("--chart-1", accent);
}

function cacheLocal(t) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(normalizeTheme(t))); } catch { /* ignore */ }
}
function getLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    return normalizeTheme(JSON.parse(raw));
  } catch { return null; }
}

// Sofort beim Start anwenden — aus dem lokalen Cache, ohne Flackern.
export function applyLocalTheme() {
  applyTheme(getLocal() || DEFAULT_THEME);
}

let activeRecord = null;

// Aktives Theme vom Server laden und anwenden (für alle Besucher).
export async function loadActiveTheme() {
  try {
    const page = await base44.entities.DesignTheme.filter({ active: true }, { sort: "-created_date", limit: 1 });
    const rec = page.items && page.items[0];
    if (rec) {
      activeRecord = rec;
      const t = { font: rec.font, lineHeight: rec.lineHeight, accentH: rec.accentH, accentS: rec.accentS, accentL: rec.accentL };
      applyTheme(t);
      cacheLocal(t);
      return t;
    }
    return null;
  } catch {
    return null;
  }
}

// Theme speichern (nur Admin): upsert des aktiven Satzes, sofort anwenden.
export async function saveTheme(t) {
  const th = normalizeTheme(t);
  applyTheme(th);
  cacheLocal(th);
  if (activeRecord && activeRecord.id) {
    await base44.entities.DesignTheme.update(activeRecord.id, { ...th, active: true });
  } else {
    activeRecord = await base44.entities.DesignTheme.create({ key: "default", ...th, active: true });
  }
  return th;
}