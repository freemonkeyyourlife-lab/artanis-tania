import { base44 } from "@/api/base44Client";
import { kindOf } from "@/lib/narratorStyle";

const SCHEMA = {
  type: "object",
  properties: {
    tip: { type: "string" },
    nudge: { type: "string" },
  },
  required: ["tip", "nudge"],
};

// Der Concierge sieht, wo die Spielerin gerade steht, und sagt etwas dazu.
export async function conciergeTip({ narrator, experience, stage, index, count, history = [] }) {
  const kind = narrator ? kindOf(narrator.kind) : null;

  const prompt = [
    narrator
      ? `Du bist ${narrator.name}, ${kind.label} in einem Story-Spiel. ${kind.prompt}`
      : "Du bist der Concierge eines Story-Spiels und begleitest die Spielerin.",
    narrator?.personality ? `Deine Art: ${narrator.personality}` : "",
    `Die Geschichte heißt „${experience?.title || "ohne Titel"}".`,
    `Du bist bei Station ${index + 1} von ${count}: ${stage?.title || "ohne Titel"} — ${stage?.overlayText || ""}`.trim(),
    history.length ? `Bisher hat sie: ${history.join(", ")}.` : "",
    "Sag ihr in 1 bis 2 kurzen Sätzen, was du siehst und worauf du sie neugierig machst. Sprich sie direkt an und duze sie.",
    '"nudge" ist ein Hinweis in höchstens 6 Wörtern, was sie jetzt tun soll.',
    "Keine Beschreibung, keine Anführungszeichen, keine Regieanweisungen.",
  ]
    .filter(Boolean)
    .join("\n");

  return await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: SCHEMA });
}