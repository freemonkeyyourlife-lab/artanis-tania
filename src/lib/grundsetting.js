// Grundsetting — die Ausrichtung einer Szene oder Sitzung. Immer dieselbe
// Auswahl, in jedem Chat und jeder Therapie: devot, dominant, alleine, zu zweit,
// Gruppe, sanft, hemmungslos. Mehrfach wählbar, jederzeit wechselbar.

export const GRUNDSETTINGS = [
  { key: "DEVOT", label: "Devot", text: "Du gibst die Führung ab, lässt dich leiten und gehst mit, was immer kommt." },
  { key: "DOMINANT", label: "Dominant", text: "Du führst, bestimmst die Richtung und forderst, was du willst." },
  { key: "AUSGLEICHEND", label: "Ausgleichend", text: "Niemand führt — ihr begegnet euch auf Augenhöhe." },
  { key: "ALLEINE", label: "Alleine", text: "Nur du und sie, kein Dritter im Raum." },
  { key: "ZU_ZWEIT", label: "Zu zweit", text: "Ihr beide, intim und ungestört." },
  { key: "GRUPPE", label: "Gruppe", text: "Mehrere sind dabei — es darf laut und verwoben werden." },
  { key: "SANFT", label: "Sanft", text: "Langsam, viel Halt, vorsichtig — kleine Schritte." },
  { key: "HEMMUNGSLOS", label: "Hemmungslos", text: "Keine Hemmungen im Rahmen — voll ausleben, was verlangt wird." },
];

const byKey = (k) => GRUNDSETTINGS.find((g) => g.key === k);

// Prompt-Block für die aktiven Grundsettings — kommt in den System-Prompt.
export const grundsettingPrompt = (keys = []) => {
  const active = (keys || []).map(byKey).filter(Boolean);
  if (!active.length) return "";
  return (
    "\n\nGRUNDSETTING (die Ausrichtung dieser Szene — halt dich daran, jederzeit gültig):\n" +
    active.map((g) => `- ${g.label}: ${g.text}`).join("\n")
  );
};

const storeKey = (id) => `chat_grund_${id || "default"}`;

export const grundFor = (id) => {
  try { return JSON.parse(localStorage.getItem(storeKey(id)) || "[]"); } catch { return []; }
};

export const setGrundFor = (id, vals) => {
  try { localStorage.setItem(storeKey(id), JSON.stringify(vals || [])); } catch {}
};