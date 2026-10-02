import { base44 } from "@/api/base44Client";
import { narratorBriefing } from "@/lib/narratorStyle";
import { getStructure } from "@/lib/onboarding";

const SCHEMA = {
  type: "object",
  properties: {
    lines: {
      type: "array",
      items: {
        type: "object",
        properties: {
          who: { type: "number" },
          text: { type: "string" },
        },
      },
    },
    nudge: { type: "string" },
  },
  required: ["lines", "nudge"],
};

// Der Concierge sieht, wo die Spielerin gerade steht, und sagt etwas dazu.
// Sind zwei Erzählerinnen dabei, spielen sie sich den Ball zu.
export async function conciergeTip({ narrators = [], experience, stage, index, count, history = [] }) {
  const two = narrators.length > 1;
  const behavior = getStructure().guideBehavior;

  const prompt = [
    "Du begleitest eine Spielerin durch ein Story-Spiel und schaust ihr über die Schulter.",
    `# Deine Erzählerinnen\n${narratorBriefing(narrators)}`,
    behavior ? `# Wie du es sagst (Benehmen, Sprache, Wortwahl)\n${behavior}` : "",
    `Die Geschichte heißt „${experience?.title || "ohne Titel"}".`,
    `Du bist bei Station ${index + 1} von ${count}: ${stage?.title || "ohne Titel"} — ${stage?.overlayText || ""}`.trim(),
    history.length ? `Bisher hat sie: ${history.join(", ")}.` : "",
    two
      ? 'Sag in 2 bis 3 kurzen Zeilen, was du siehst und worauf du sie neugierig machst. "who" ist die Nummer der Erzählerin von oben. Sie wechseln sich ab und greifen einander auf — wie zwei, die sich den Ball zuspielen, ohne sich zu wiederholen.'
      : 'Sag in 1 bis 2 kurzen Zeilen, was du siehst und worauf du sie neugierig machst. "who" ist immer 0.',
    "Sprich sie direkt an und duze sie.",
    '"nudge" ist ein Hinweis in höchstens 6 Wörtern, was sie jetzt tun soll.',
    "Keine Beschreibung, keine Anführungszeichen, keine Regieanweisungen.",
  ]
    .filter(Boolean)
    .join("\n");

  return await base44.integrations.Core.InvokeLLM({ prompt, response_json_schema: SCHEMA });
}