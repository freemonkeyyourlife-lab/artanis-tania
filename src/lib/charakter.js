import { paletteBriefing, paletteVoiceDelta } from "@/lib/palette";
import { COMBINE_KINDS, modulesOfKind } from "@/lib/combine";

// Eine Figur besteht aus sechs Feldern. David und Gäste füllen dieselben —
// es gibt keinen Unterschied außer der Herkunft, die mitgespeichert wird.

export const TEXT_FIELDS = [
  {
    key: "appearance",
    label: "Aussehen",
    hint: "Körper, Gesicht, Haare, Kleidung — was man sieht.",
    placeholder: "Groß, dunkle Locken, Sommersprossen, trägt gern weite Hemden …",
  },
  {
    key: "art",
    label: "Art",
    hint: "Was für ein Wesen sie ist.",
    placeholder: "Mensch / Dämonin / KI / Pflanze / etwas dazwischen …",
  },
  {
    key: "behavior",
    label: "Benehmen",
    hint: "Wie sie sich benimmt: Tempo, Nähe, Ton, Grenzen.",
    placeholder: "Ruhig, hört länger zu als sie redet, wird erst laut, wenn es zählt …",
  },
  {
    key: "understanding",
    label: "Verständnis",
    hint: "Was sie versteht und wie fein sie darauf eingeht.",
    placeholder: "Versteht Andeutungen sofort, merkt sich Kleinigkeiten, fragt nach …",
  },
];

export const emptyCharacter = () => ({
  name: "",
  adultAge: "",
  createdByRole: "GAST",
  fictional: true,
  sourceConsentVerified: false,
  appearance: "",
  art: "",
  behavior: "",
  understanding: "",
  personality: "",
  description: "",
  neigungen: [],
  voiceId: "",
  moduleIds: [],
  avatar: "",
  images: [],
});

// Unter 18 geht nichts. Reale Personen nur mit ausdrücklicher Freigabe.
export function characterGuard(c) {
  if (!String(c?.name || "").trim()) return "Der Name fehlt.";
  if (!c?.adultAge || Number(c.adultAge) < 18) return "Die Figur muss mindestens 18 sein.";
  if (c.fictional === false && !c.sourceConsentVerified)
    return "Reale Personen nur mit ausdrücklicher Freigabe — sonst als fiktiv anlegen.";
  return "";
}

// Die Figur als Anweisung — mit Neigungen und den gewählten Bausteinen.
export function characterBriefing(c, { paletteList, modules = [] } = {}) {
  if (!c) return "";
  const parts = [];

  parts.push(
    `Figur: ${c.name}${c.adultAge ? `, ${c.adultAge}` : ""}${c.art ? ` (${c.art})` : ""}`
  );
  if (c.appearance) parts.push(`Aussehen: ${c.appearance}`);
  if (c.behavior) parts.push(`Benehmen: ${c.behavior}`);
  if (c.understanding) parts.push(`Verständnis: ${c.understanding}`);
  if (c.personality) parts.push(`Wesen: ${c.personality}`);
  if (c.description) parts.push(`Rahmen: ${c.description}`);

  const neigung = paletteBriefing(paletteList, c.neigungen || []);
  if (neigung) parts.push(`Neigung:\n${neigung}`);

  const picked = (modules || []).filter((m) => (c.moduleIds || []).includes(m.id));
  COMBINE_KINDS.forEach((k) => {
    const ofKind = picked.filter((m) => m.kind === k.id);
    if (!ofKind.length) return;
    parts.push(
      `${k.label}:\n${ofKind.map((m) => `- ${m.title}${m.text ? `: ${m.text}` : ""}`).join("\n")}`
    );
  });

  parts.push("Alle Beteiligten sind fiktive Erwachsene (18+). Keine realen Personen.");
  return parts.join("\n");
}

// Die Stimme, die aus den Neigungen dieser Figur folgt.
export const characterVoiceDelta = (c, paletteList) =>
  paletteVoiceDelta(paletteList, c?.neigungen || []);

export const roleModules = (modules) => modulesOfKind(modules, "ROLLE");

export const ROLE_HINT =
  "Rollen sind Aufgaben in der Szene — Voyeurin, Partnerin, Anmachende, Beraterin, " +
  "Selbst Interessierte, Animierende, Fragenstellende, Rauskitzelnde, Ideen-Fördernde. " +
  "Mehrere gleichzeitig sind der Normalfall.";