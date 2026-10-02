import { base44 } from "@/api/base44Client";
import { CARTOON_STYLE, IMAGE_SAFE_RULES, PHOTOREAL } from "@/lib/appearance";

const PERSON = {
  SOLO_MALE: "ein Mann",
  SOLO_FEMALE: "eine Frau",
  SHEMALE: "eine Trans-Frau",
  COUPLE: "ein Paar",
  GROUP: "eine Gruppe",
};

// Aus rohen Stichworten wird ein fertiger Prompt. Ist ein Charakter dabei,
// steht sein Aussehen mit drin — damit alle Bilder zusammenpassen.
export async function writePrompt({ rough, target = "BILD", style = "FOTO", character = null }) {
  const kind = target === "VIDEO" ? "Video" : target === "TEXT" ? "Text" : "Bild";

  const styleLine =
    target === "TEXT"
      ? ""
      : `AUSSEHEN & STIL (immer mit einbauen): ${style === "ANIMIERT" ? CARTOON_STYLE : PHOTOREAL}${IMAGE_SAFE_RULES}`;

  const personLine = character
    ? `\nDIE PERSON (muss in jedem Bild erkennbar dieselbe bleiben): Name "${character.stageName}", ${PERSON[character.personaType] || "eine Frau"}${character.age ? `, ${character.age} Jahre` : ""}${character.tagline ? `, ${character.tagline}` : ""}.`
    : "";

  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `Du schreibst Prompts für ${kind === "Text" ? "Text-KI" : `${kind}-KI-Modelle`}.

AUFGABE: Mach aus den Stichworten unten EINEN einzigen, präzisen Prompt.

REGELN:
- Sprache: Englisch. Bei Bild und Video knapp und konkret, kommagetrennt, mit Kamerawinkel, Licht und Stimmung. Bei Text in ganzen Sätzen, als klare Anweisung.
- Jede Vorgabe übernehmen: Ort, Pose, Kleidung, Handlung, Licht, Stimmung. Nichts dazu erfinden, was widerspricht.
- Kein Vorwort, keine Erklärungen, keine Anführungszeichen, keine Überschriften. Nur der Prompt.
${styleLine}${personLine}

STICHWORTE (Deutsch, ungeordnet):
"""${rough.trim()}"""`,
    response_json_schema: {
      type: "object",
      properties: { prompt: { type: "string" } },
      required: ["prompt"],
    },
  });

  return res?.prompt || "";
}