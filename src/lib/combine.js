import { paletteBriefing, paletteVoiceDelta } from "@/lib/palette";

// Jeder mit jedem: Neigung, Rolle, Situation, Szenario, Erstellung und Import
// werden zu einer einzigen Anweisung zusammengesetzt. Nichts schließt etwas
// aus — es gibt keine verbotenen Paare, nur Reihenfolgen.

export const COMBINE_KINDS = [
  { id: "ROLLE", label: "Rolle", hint: "Welche Aufgabe sie in der Szene hat." },
  { id: "SITUATION", label: "Situation", hint: "Wo es passiert und mit wem." },
  { id: "SZENARIO", label: "Szenario", hint: "Der Ablauf von Anfang bis Ende." },
  { id: "ERSTELLUNG", label: "Erstellung", hint: "Was dabei entstehen soll." },
  { id: "IMPORT", label: "Import", hint: "Fremde Vorlagen, die hier mitlaufen." },
];

export const kindLabelOf = (id) => COMBINE_KINDS.find((k) => k.id === id)?.label || id;

export const modulesOfKind = (modules = [], kind) =>
  (modules || []).filter((m) => m.kind === kind && m.active !== false);

// Alles zusammen → ein Text, der so in den Charakter oder in den Chat kann.
export function combineBriefing({ paletteList, neigungen = [], modules = [] } = {}) {
  const parts = [];

  const neigung = paletteBriefing(paletteList, neigungen);
  if (neigung) parts.push(`Neigung:\n${neigung}`);

  COMBINE_KINDS.forEach((k) => {
    const picked = modulesOfKind(modules, k.id);
    if (!picked.length) return;
    const lines = picked
      .map((m) => (m.text ? `- ${m.title}: ${m.text}` : `- ${m.title}`))
      .join("\n");
    parts.push(`${k.label}:\n${lines}`);
  });

  return parts.join("\n\n");
}

// Die Stimme, die aus der Neigungs-Auswahl folgt.
export const combineVoiceDelta = ({ paletteList, neigungen = [] } = {}) =>
  paletteVoiceDelta(paletteList, neigungen);

// Zählt, wie viel gerade zusammengestellt ist — für die Anzeige.
export const combineCount = ({ neigungen = [], modules = [] } = {}) =>
  neigungen.length + modules.filter((m) => m?.active !== false).length;