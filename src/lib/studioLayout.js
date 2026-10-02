// Die Anordnung des Externen Studios: welche Bereiche, in welcher Reihenfolge,
// unter welchem Namen, wo das Menü sitzt und womit es startet.
// Gespeichert im SiteLayout unter studioLayout.

export const STUDIO_SECTIONS = [
  { id: "overview", label: "Übersicht" },
  { id: "mass", label: "Massen-Erzeugung" },
  { id: "prompt", label: "Prompts & Upload" },
];

export const NAV_POSITIONS = [
  { id: "top", label: "Oben als Reiter" },
  { id: "side", label: "Links als Seitenleiste" },
];

export function defaultStudioLayout() {
  return {
    sections: STUDIO_SECTIONS.map((s) => ({ id: s.id, label: s.label, hidden: false })),
    nav: "top",
    start: "overview",
  };
}

// Gespeichertes mit dem Standard zusammenführen — neue Bereiche tauchen
// automatisch hinten auf, unbekannte fallen weg.
export function normalizeStudioLayout(saved) {
  const base = defaultStudioLayout();
  if (!saved || !Array.isArray(saved.sections)) return base;
  const known = new Set(STUDIO_SECTIONS.map((s) => s.id));
  const kept = saved.sections
    .filter((s) => s && known.has(s.id))
    .map((s) => ({ id: s.id, label: s.label || base.sections.find((b) => b.id === s.id).label, hidden: !!s.hidden }));
  const have = new Set(kept.map((s) => s.id));
  const sections = [...kept, ...base.sections.filter((s) => !have.has(s.id))];
  const visible = sections.filter((s) => !s.hidden);
  const start = visible.some((s) => s.id === saved.start) ? saved.start : visible[0]?.id || "overview";
  return { sections, nav: saved.nav === "side" ? "side" : "top", start };
}