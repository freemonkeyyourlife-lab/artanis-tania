// Die Stellen der App, die der Wunsch-Workflow als Ziele kennen darf — damit
// jeder Schritt auf einen echten Pfad führt, den der Nutzer anklicken kann.
export const WUNSCH_ROUTES = [
  { path: "/owner", label: "Besitzer-Konsole / Godmode" },
  { path: "/studio", label: "Studio" },
  { path: "/messages", label: "Nachrichten / Chat" },
  { path: "/chatmodul", label: "Chat-Modul" },
  { path: "/trainingsset", label: "Trainingssets" },
  { path: "/charakter", label: "Charakter-Studio" },
  { path: "/stimmen", label: "Stimmbank" },
  { path: "/erzaehler", label: "Erzählerin" },
  { path: "/vorleser", label: "Vorleser" },
  { path: "/ideen", label: "Ideen-Ordner" },
  { path: "/logbuch", label: "Logbuch" },
  { path: "/leitfaden", label: "Leitfaden" },
  { path: "/spickzettel", label: "Spickzettel" },
  { path: "/verkauf", label: "Verkaufs-Dashboard" },
  { path: "/planung", label: "Content-Planer" },
  { path: "/archiv", label: "Archiv" },
  { path: "/recht", label: "Recht" },
];

export const WUNSCH_SCHEMA = {
  type: "object",
  properties: {
    titel: { type: "string" },
    verstanden: { type: "string" },
    schritte: {
      type: "array",
      items: {
        type: "object",
        properties: {
          titel: { type: "string" },
          was: { type: "string" },
          ort: { type: "string" },
          ort_label: { type: "string" },
        },
        required: ["titel", "was"],
      },
    },
  },
  required: ["titel", "verstanden", "schritte"],
};

// Der Prompt baut aus einem frei formulierten Wunsch einen klaren Plan — jeder
// Schritt nennt einen Ort aus der Liste, damit der Nutzer gleich weiterkommt.
export const buildWunschPrompt = (wish) => `Du bist der Wegweiser von „Artanis × Tania", einer Plattform für Story-Games, Rollenspiel und private Video-Erlebnisse für Erwachsene.

Jemand sagt frei, was er bauen, erleben oder einrichten will. Mach daraus einen kurzen, klaren Schritt-für-Schritt-Plan.

Der Wunsch:
"""${wish}"""

Regeln:
- „titel": ein kurzer Name für den Plan.
- „verstanden": ein Satz, der zeigt, dass du ihn verstanden hast.
- „schritte": 3 bis 6 Schritte, jeder mit „titel" (was), „was" (ein Satz, was dort genau zu tun ist) und „ort".
- „ort" MUSS genau ein Pfad aus dieser Liste sein, sonst leer:
${WUNSCH_ROUTES.map((r) => `${r.path} = ${r.label}`).join("\n")}
- „ort_label": der Anzeigename zu diesem Pfad aus der Liste.
- Sprache: Deutsch, direkt, einfache Worte.`;