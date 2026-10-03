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

// Frau oder Mann: daran hängt die erste Zeile des Prompts — und welche Achsen
// überhaupt geladen werden.
export const GENDERS = [
  {
    key: "FRAU",
    label: "Frau",
    subject: "Erwachsene Frau, fotorealistische Aufnahme.",
    pronoun: "So ist sie",
  },
  {
    key: "MANN",
    label: "Mann",
    subject: "Erwachsener Mann, fotorealistische Aufnahme.",
    pronoun: "So ist er",
  },
];

const rows = (res) => (Array.isArray(res) ? res : res?.items || []);

export async function loadAxes(gender = "FRAU") {
  return rows(
    await base44.entities.FigureAxis.filter(
      { active: true, gender: { $in: ["ALLGEMEIN", gender] } },
      { sort: "order", limit: 80 }
    )
  ).filter((a) => (a.options || []).length);
}

// Eine Figur zusammensetzen: die gewählten Worte in der Reihenfolge der Achsen.
// Das Ergebnis ist reiner Text — und reiner Text läuft bei jeder Maschine.
export function composeFigure(axes, picked, gender = "FRAU") {
  const g = GENDERS.find((x) => x.key === gender) || GENDERS[0];
  const parts = axes
    .map((a) => ({ axis: a.name, option: (a.options || []).find((o) => o.label === picked[a.id]) }))
    .filter((p) => p.option);

  const text = parts.map((p) => p.option.text).filter(Boolean).join(", ");
  const mine = parts.map((p) => p.option.note).filter((n) => n && n.trim());
  const prompt = [
    `${g.subject} ${text}.`,
    mine.length ? `${g.pronoun}: ${mine.join(" ")}` : "",
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