import { base44 } from "@/api/base44Client";
import { CARTOON_STYLE, IMAGE_SAFE_RULES, PHOTOREAL } from "@/lib/appearance";

const PERSON = {
  SOLO_MALE: "ein Mann",
  SOLO_FEMALE: "eine Frau",
  SHEMALE: "eine Trans-Frau",
  COUPLE: "ein Paar",
  GROUP: "eine Gruppe",
};

// Aus rohen Stichworten wird ein fertiger Prompt — in der Syntax des gewählten
// Modells, mit dem passenden Negativ-Prompt und LoRA-Zusatz dazu.
export async function writePrompt({ rough, target = "BILD", style = "FOTO", character = null, preset = null }) {
  const kind = target === "VIDEO" ? "Video" : target === "TEXT" ? "Text" : "Bild";
  const isImage = target !== "TEXT";
  const recipe = isImage ? preset : null;

  const styleLine = isImage
    ? `AUSSEHEN & STIL (immer mit einbauen): ${style === "ANIMIERT" ? CARTOON_STYLE : PHOTOREAL}${IMAGE_SAFE_RULES}`
    : "";

  const personLine = character
    ? `\nDIE PERSON (muss in jedem Bild erkennbar dieselbe bleiben): Name "${character.stageName}", ${PERSON[character.personaType] || "eine Frau"}${character.age ? `, ${character.age} Jahre` : ""}${character.tagline ? `, ${character.tagline}` : ""}.`
    : "";

  const syntaxLine = recipe
    ? `
DIE SPRACHE DES MODELLS — „${recipe.label}“ (${recipe.family}):
- Aufbau: ${recipe.mode}. ${recipe.howto}
- Der Prompt MUSS genau mit diesem Anfang beginnen: ${recipe.start}
- Dieser Wortschatz gehört dazu und wird benutzt, wo er zur Idee passt: ${recipe.vocabulary}
- Den Anfang nicht in Anführungszeichen setzen und nichts davor stellen.`
    : "";

  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `Du schreibst Prompts für ${kind === "Text" ? "Text-KI" : `${kind}-KI-Modelle`}.

AUFGABE: Mach aus den Stichworten unten EINEN einzigen, sehr detaillierten Prompt.

REGELN:
- Sprache: Englisch.${recipe ? " Halte dich an den geforderten Aufbau." : " Bei Bild und Video knapp und konkret, kommagetrennt, mit Kamerawinkel, Licht und Stimmung. Bei Text in ganzen Sätzen, als klare Anweisung."}
- Jede Vorgabe übernehmen: Ort, Pose, Kleidung, Handlung, Licht, Stimmung. Nichts dazu erfinden, was widerspricht.
- Reich an Details: Körperhaltung, Blickrichtung, Hände, Stoffe, Lichtführung, Hintergrund. Nichts doppelt nennen.
- Kein Vorwort, keine Erklärungen, keine Anführungszeichen, keine Überschriften. Nur der Prompt.
${styleLine}${personLine}${syntaxLine}

STICHWORTE (Deutsch, ungeordnet):
"""${rough.trim()}"""`,
    response_json_schema: {
      type: "object",
      properties: { prompt: { type: "string" } },
      required: ["prompt"],
    },
  });

  return {
    prompt: res?.prompt || "",
    negative: recipe?.negative || "",
    lora: recipe?.lora || "",
  };
}