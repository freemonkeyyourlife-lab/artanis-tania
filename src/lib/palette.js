// Die Neigungs-Palette: acht Stufen, die den Ton eines Charakters verschieben.
// Jede ist einzeln wählbar — und alle zusammen. Sie stehen nie allein, sie
// legen sich auf das, was der Charakter ohnehin ist. Reihenfolge = Stufe.

export const PALETTE = [
  {
    key: "FLIRTY",
    label: "Flirty",
    level: 1,
    kurz: "Neckt und spielt an, ohne es auszusprechen.",
    prompt: "Du neckst ihn, machst Andeutungen und lässt ihn raten. Du lächelst dabei.",
    speed: 0.08,
    depth: 8,
    style: 0.25,
  },
  {
    key: "INTERESSIERT",
    label: "Interessiert",
    level: 2,
    kurz: "Fragt nach, hört zu, will wirklich wissen.",
    prompt: "Du fragst nach und hörst zu. Du hakst nach, bis du es genau weißt.",
    speed: 0.03,
    depth: 6,
    style: 0.05,
  },
  {
    key: "SEXY",
    label: "Sexy",
    level: 3,
    kurz: "Bewusst und selbstsicher, langsam im Ton.",
    prompt: "Du bist dir deiner sicher. Du sprichst langsam, setzt Pausen und lässt wirken, was du sagst.",
    speed: -0.08,
    depth: -10,
    style: 0.3,
  },
  {
    key: "EXOTISCH",
    label: "Exotisch",
    level: 4,
    kurz: "Eigener Klang, eigene Bilder, geheimnisvoll.",
    prompt: "Du sprichst in Bildern aus deiner eigenen Welt und bleibst ein Stück fremd. Du erklärst nichts von selbst.",
    speed: -0.03,
    depth: 4,
    style: 0.2,
  },
  {
    key: "ERREGT",
    label: "Erregt",
    level: 5,
    kurz: "Atmet kürzer, spricht in kurzen Sätzen.",
    prompt: "Du bist aufgeladen. Kurze Sätze, schnellere Atmung, du unterbrichst dich selbst.",
    speed: 0.14,
    depth: -14,
    style: 0.35,
  },
  {
    key: "OFFEN",
    label: "Offen",
    level: 6,
    kurz: "Sagt direkt, was sie will. Ohne Umschweife.",
    prompt: "Du sagst direkt, was du willst und was du nicht willst. Kein Andeuten, kein Raten.",
    speed: 0,
    depth: -8,
    style: 0.1,
  },
  {
    key: "EXPLIZIT",
    label: "Explizit",
    level: 7,
    kurz: "Benennt alles beim Namen.",
    prompt: "Du benennst alles beim Namen, ohne es zu umschreiben. Du beschreibst, was passiert, und was du dabei willst.",
    speed: 0.02,
    depth: -18,
    style: 0.15,
  },
  {
    key: "HART",
    label: "Hart",
    level: 8,
    kurz: "Führt, fordert, fragt nicht nach.",
    prompt: "Du führst. Du sagst, wo es langgeht, und erwartest, dass er mitkommt. Du fragst nicht um Erlaubnis.",
    speed: -0.02,
    depth: -22,
    style: 0.25,
  },
];

// Ist die Palette im Haus gepflegt, gilt sie. Sonst die eingebaute.
export const paletteFor = (list) => (list?.length ? list : PALETTE);

export const paletteKeyOf = (entry) => entry?.key || entry?.id;

export const paletteSorted = (list) =>
  [...paletteFor(list)].sort((a, b) => (a.level || 0) - (b.level || 0));

// Gewählte Neigungen → Verhaltenstext für die KI. Aufsteigend nach Stufe,
// damit die Anweisung sich von sanft nach deutlich aufbaut.
export function paletteBriefing(list, keys = []) {
  const chosen = paletteFor(list).filter((p) => keys.includes(paletteKeyOf(p)));
  if (!chosen.length) return "";
  return chosen
    .sort((a, b) => (a.level || 0) - (b.level || 0))
    .map((p) => `${p.label} (Stufe ${p.level}): ${p.prompt}`)
    .join("\n");
}

// Dieselben Neigungen → Zusatz für die Stimme. Wird auf die Stimme gelegt.
export function paletteVoiceDelta(list, keys = []) {
  const delta = { speed: 0, depth: 0, style: 0 };
  paletteFor(list)
    .filter((p) => keys.includes(paletteKeyOf(p)))
    .forEach((p) => {
      delta.speed += p.speed || 0;
      delta.depth += p.depth || 0;
      delta.style += p.style || 0;
    });
  return delta;
}

export function paletteMaxLevel(list, keys = []) {
  const levels = paletteFor(list)
    .filter((p) => keys.includes(paletteKeyOf(p)))
    .map((p) => p.level || 0);
  return levels.length ? Math.max(...levels) : 0;
}

// Wie die Auswahl zusammen klingt — als ein Satz für die Anzeige.
export function paletteTone(list, keys = []) {
  const level = paletteMaxLevel(list, keys);
  if (!level) return "noch nichts gewählt";
  if (level <= 2) return "leicht und zugewandt";
  if (level <= 4) return "deutlich und selbstsicher";
  if (level <= 6) return "direkt und offen";
  return "hart und führend";
}