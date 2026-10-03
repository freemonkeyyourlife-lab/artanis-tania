// Der Ideen-Ordner: was in einer Karte stehen kann und wie es heißt.
// Nichts ist festgelegt — die Liste ist nur eine Hilfe beim Sortieren.

export const IDEA_KINDS = [
  { value: "IDEE", label: "Idee" },
  { value: "GESCHICHTE", label: "Geschichte" },
  { value: "SZENE", label: "Szene" },
];

export const IDEA_STATUS = [
  { value: "IDEE", label: "Nur eine Idee" },
  { value: "IN ARBEIT", label: "In Arbeit" },
  { value: "FERTIG", label: "Fertig" },
];

export const kindLabel = (value) =>
  IDEA_KINDS.find((k) => k.value === value)?.label || "Idee";

export const statusLabel = (value) =>
  IDEA_STATUS.find((s) => s.value === value)?.label || "Nur eine Idee";