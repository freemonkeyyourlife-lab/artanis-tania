// Die Struktur der Kopfzeile: Bereiche mit ihren Knöpfen. Alles daran ist frei
// — Reihenfolge, Namen, Ziele, ganze Bereiche. Gespeichert wird sie in
// SiteLayout, gelesen von der Kopfzeile und von der Struktur-Übersicht.

import { FIXED_AREAS, ALWAYS_IN_MENU, MENU_AREA_LABEL, groupNavItems } from "@/lib/modules";
import { DEFAULT_MENU } from "@/lib/siteLayout";

const slug = (value) =>
  String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

// Jeder Knopf bekommt eine feste Kennung — daran hängt das Ziehen.
const withIds = (items, prefix) => {
  const seen = new Map();
  return (items || [])
    .filter((it) => it && (it.path || it.label))
    .map((it, i) => {
      const base = it.id || `${prefix}-${slug(it.label || it.path) || i}`;
      const n = (seen.get(base) || 0) + 1;
      seen.set(base, n);
      return {
        id: n > 1 ? `${base}-${n}` : base,
        label: it.label || "",
        path: it.path || "/",
        hidden: !!it.hidden,
      };
    });
};

// Die Struktur, mit der alles anfängt: die drei festen Bereiche und dein Menü.
export function defaultStructure(navItems) {
  const menu = Array.isArray(navItems) && navItems.length ? navItems : DEFAULT_MENU;
  const inMenu = new Set(menu.map((m) => m.path));
  const area = (i) => FIXED_AREAS[i];
  return {
    areas: [
      { id: "characters", label: area(0).label, items: withIds(area(0).items, "char") },
      { id: "create", label: area(1).label, items: withIds(area(1).items, "create") },
      {
        id: "explore",
        label: MENU_AREA_LABEL,
        items: withIds([...menu, ...ALWAYS_IN_MENU.filter((a) => !inMenu.has(a.path))], "menu"),
      },
      { id: "admin", label: area(2).label, items: withIds(area(2).items, "admin") },
    ],
  };
}

// Was gespeichert ist — oder der Standard, wenn noch nichts da ist.
export function structureOf(record) {
  const saved = record?.structure;
  if (saved && Array.isArray(saved.areas) && saved.areas.length) {
    const base = defaultStructure(record?.navItems);
    return {
      areas: saved.areas.map((a, i) => {
        const area = {
          id: a.id || `area-${i}`,
          label: a.label || `Bereich ${i + 1}`,
          items: withIds(a.items, `a${i}`),
        };
        // Feste Bereiche wachsen weiter: ein neuer Knopf taucht auch in einer
        // schon gespeicherten Struktur auf — dort, wo sein Bereich steht.
        // „Erleben" ist dein eigener Bereich — dort wird nichts nachgetragen.
        const fixed = area.id === "explore" ? null : base.areas.find((f) => f.id === area.id);
        if (!fixed) return area;
        const have = new Set(area.items.map((it) => it.path));
        const missing = fixed.items.filter((it) => !have.has(it.path));
        return missing.length ? { ...area, items: [...area.items, ...missing] } : area;
      }),
    };
  }
  return defaultStructure(record?.navItems);
}

// Genau das rendert die Kopfzeile: leere Bereiche fallen weg, doppelte Ziele auch.
export function structureGroups(structure) {
  const seen = new Set();
  return (structure?.areas || [])
    .map((area) => {
      const items = (area.items || []).filter((it) => {
        if (!it || !it.path || it.hidden || seen.has(it.path)) return false;
        seen.add(it.path);
        return true;
      });
      return { label: area.label, items, groups: groupNavItems(items) };
    })
    .filter((group) => group.items.length > 0);
}

export const exploreArea = (structure) =>
  (structure?.areas || []).find((a) => a.id === "explore") || null;

// Das Menü als flache Liste — für die Ansichten, die noch damit arbeiten.
export const structureMenu = (structure) => exploreArea(structure)?.items || [];

// Änderungen aus diesen Ansichten landen wieder im Bereich „Erleben“.
export function applyMenu(structure, menuItems) {
  return {
    ...structure,
    areas: (structure?.areas || []).map((a) =>
      a.id === "explore" ? { ...a, items: withIds(menuItems, "menu") } : a
    ),
  };
}