import { explicitLabel, moodLabel, styleLabel } from "@/lib/modelTags";

// Die Bots, die sich trainieren lassen — jeder mit seinem eigenen Ton.
export const PERSONAS = [
  { id: "ARTANIS_AI", mode: "artanis", label: "Artanis" },
  { id: "TRIANIA_AI", mode: "triania", label: "Triania" },
  { id: "COUPLE_AI", mode: "couple", label: "Artanis & Triania" },
];

export const personaById = (id) => PERSONAS.find((p) => p.id === id) || PERSONAS[0];

export const emptyTraining = () => ({
  moods: [],
  explicit: "",
  style: "",
  tone: 5,
  length: 3,
  instruction: "",
});

export const toneLabel = (n) =>
  n <= 3 ? "ruhig" : n <= 7 ? "ausgeglichen" : "feurig";

export const lengthLabel = (n) =>
  n <= 2 ? "kurz" : n <= 4 ? "mittel" : "ausführlich";

const TONE_RULE = {
  low: "Stay calm, restrained and unhurried. Do not push the heat — let the user set the pace.",
  mid: "Be warm and engaged. Escalate only when the user does, one step at a time.",
  high: "Be hot, forward and quick to get carried away. React strongly to what the user brings.",
};

// Aus den Einstellungen wird die Anweisung, die der Bot zusätzlich liest.
export function trainingBlock(t = {}) {
  const moods = (t.moods || []).map(moodLabel).join(", ");
  const tone = Number.isFinite(t.tone) ? t.tone : 5;
  const length = Number.isFinite(t.length) ? t.length : 3;
  const lines = ["═══ TRAINING — PERSONALITY, TONE & LIMITS (follow strictly) ═══"];

  if (moods) lines.push(`MOOD & INTENT: ${moods}. Let this colour every reply.`);
  if (t.style) lines.push(`WRITING STYLE: ${styleLabel("TEXT", t.style)} — shape the reply this way.`);
  if (t.explicit) {
    lines.push(
      `EXPLICIT LIMIT: "${explicitLabel(t.explicit)}". Never go past this level. If the user pushes for more, stay inside the limit and tease instead.`
    );
  }
  lines.push(`INTENSITY: ${tone}/10 (${toneLabel(tone)}). ${tone <= 3 ? TONE_RULE.low : tone <= 7 ? TONE_RULE.mid : TONE_RULE.high}`);
  lines.push(`LENGTH: about ${length} sentence(s) per reply (${lengthLabel(length)}). Never dump text.`);
  if (t.instruction && t.instruction.trim()) {
    lines.push(`EXTRA DIRECTION: ${t.instruction.trim()}`);
  }
  lines.push("═══ END TRAINING ═══");

  return lines.join("\n");
}