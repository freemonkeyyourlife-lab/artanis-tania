// Das Logbuch: jeder Auftrag aus dem Godmode-Chat wird zu einem Prompt, der
// den ursprünglichen Wortlaut wörtlich mitschleppt. Nichts wird umgedeutet —
// sonst baut man am Ende etwas anderes, als gemeint war.

export const STATUS = {
  WARTESCHLANGE: "WARTESCHLANGE",
  IN_ARBEIT: "IN_ARBEIT",
  FERTIG: "FERTIG",
  VERWORFEN: "VERWORFEN",
};

export const STATUS_ORDER = [STATUS.WARTESCHLANGE, STATUS.IN_ARBEIT, STATUS.FERTIG, STATUS.VERWORFEN];

export const STATUS_LABEL = {
  WARTESCHLANGE: "Warteschlange",
  IN_ARBEIT: "In Arbeit",
  FERTIG: "Fertig",
  VERWORFEN: "Verworfen",
};

export const TASK_KINDS = [
  { id: "MODUL", label: "Modul" },
  { id: "LOGBUCH", label: "Logbuch" },
  { id: "LAYOUT", label: "Layout" },
  { id: "DESIGN", label: "Design" },
  { id: "DATEN", label: "Daten" },
  { id: "SONSTIGES", label: "Sonstiges" },
];

export const kindLabel = (id) => TASK_KINDS.find((k) => k.id === id)?.label || id;

// Eine Überschrift aus dem Text — die erste Zeile, kurz gehalten.
export const titleFromText = (text = "") => {
  const first = String(text).trim().split("\n").find((l) => l.trim()) || "Neuer Auftrag";
  return first.length > 80 ? `${first.slice(0, 77)}…` : first;
};

// Der eigentliche Kern: aus einem gesprochenen oder getippten Auftrag wird ein
// präziser Bau-Prompt — mit dem Originaltext wörtlich darin eingebettet.
export function buildCodePrompt({ text = "", kind = "MODUL", title = "" } = {}) {
  const raw = String(text).trim();
  const head = title || titleFromText(raw);
  const area = kindLabel(kind);

  return [
    `AUFTRAG: ${head}`,
    "",
    "Der folgende Beschreibungstext ist wörtlich übernommen und allein maßgeblich.",
    "Er darf nicht umgedeutet, gekürzt oder geglättet werden:",
    "",
    "--- ORIGINALTEXT (wörtlich) ---",
    raw,
    "--- ENDE ORIGINALTEXT ---",
    "",
    `Bereich: ${area}`,
    "",
    "Umsetzung:",
    "1. Setze genau das um, was im Originaltext steht — nichts mehr, nichts weniger.",
    "2. Nenne die Dateien, die angefasst werden.",
    "3. Baue in die bestehende Struktur der App hinein, nichts daneben.",
    "4. Melde am Schluss, was gebaut wurde und was offen bleibt.",
  ].join("\n");
}

// Ein Eintrag für die fortlaufende Dokumentation.
export const logLine = (text) => `${new Date().toISOString()} — ${text}`;