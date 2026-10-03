import { base44 } from "@/api/base44Client";

// Das Raster: die Figur wird nicht mehr in einem Satz beschrieben, sondern in
// Achsen zerlegt. Jede Achse hat feste Möglichkeiten, jede Möglichkeit hat ihre
// Worte für die Maschine — und daneben deine eigenen Worte für das, was gemeint ist.

export const AXIS_KINDS = {
  KOERPER: "Körper",
  GESICHT: "Gesicht",
  WESEN: "Wesen",
  KLEIDUNG: "Kleidung",
  ROLLE: "Rolle",
  DETAIL: "Detail",
};

const rows = (res) => (Array.isArray(res) ? res : res?.items || []);

export async function loadAxes() {
  return rows(await base44.entities.FigureAxis.filter({ active: true }, { sort: "order", limit: 60 })).filter(
    (a) => (a.options || []).length
  );
}

// Eine Figur zusammensetzen: die gewählten Worte in der Reihenfolge der Achsen.
// Das Ergebnis ist reiner Text — und reiner Text läuft bei jeder Maschine.
export function composeFigure(axes, picked) {
  const parts = axes
    .map((a) => ({ axis: a.name, option: (a.options || []).find((o) => o.label === picked[a.id]) }))
    .filter((p) => p.option);

  const text = parts.map((p) => p.option.text).filter(Boolean).join(", ");
  const mine = parts.map((p) => p.option.note).filter((n) => n && n.trim());
  const prompt = [
    `Erwachsene Frau, fotorealistische Aufnahme. ${text}.`,
    mine.length ? `So ist sie: ${mine.join(" ")}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  return { prompt, parts };
}

// Deine Worte an einer Möglichkeit festhalten — daraus lernt das Raster.
export async function saveNote(axis, label, note) {
  const options = (axis.options || []).map((o) => (o.label === label ? { ...o, note } : o));
  return base44.entities.FigureAxis.update(axis.id, { options });
}