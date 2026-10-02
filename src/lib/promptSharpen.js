import { base44 } from "@/api/base44Client";
import { CARTOON_STYLE, IMAGE_SAFE_RULES, PHOTOREAL } from "@/lib/appearance";

const PERSON = {
  SOLO_MALE: "ein Mann",
  SOLO_FEMALE: "eine Frau",
  SHEMALE: "eine Trans-Frau",
  COUPLE: "ein Paar",
  GROUP: "eine Gruppe",
};

// Die Figur der Erzählerin in der Form, die der Prompt-Schreiber versteht.
export function characterFromNarrator(narrator) {
  if (!narrator?.name) return null;
  return {
    stageName: narrator.name,
    personaType: narrator.gender === "MAENNLICH" ? "SOLO_MALE" : "SOLO_FEMALE",
    tagline: narrator.appearance || "",
  };
}

// Erst schreiben, dann nachfragen: aus dem Gesagten wird ein fertiger Prompt —
// und gleich die Fragen dazu, mit denen er noch genauer wird.
export async function sharpenPrompt({
  prompt,
  target = "BILD",
  style = "FOTO",
  character = null,
  preset = null,
  note = "",
  answers = [],
  previous = "",
}) {
  const kind = target === "VIDEO" ? "Video" : target === "TEXT" ? "Text" : "Bild";
  const isText = target === "TEXT";

  const styleLine = isText
    ? ""
    : `\nSTIL (immer mit einbauen): ${style === "ANIMIERT" ? CARTOON_STYLE : PHOTOREAL}${IMAGE_SAFE_RULES}`;

  const personLine = character
    ? `\nDIE PERSON (muss dieselbe bleiben): ${PERSON[character.personaType] || "eine Frau"}${character.stageName ? `, Name "${character.stageName}"` : ""}${character.age ? `, ${character.age} Jahre` : ""}${character.tagline ? `, ${character.tagline}` : ""}.`
    : "";

  const syntaxLine = preset
    ? `\nSPRACHE DES MODELLS — "${preset.label}": Aufbau: ${preset.mode}. ${preset.howto} Der Prompt beginnt mit: ${preset.start} Wortschatz, wo er passt: ${preset.vocabulary}`
    : "";

  const prevLine = previous.trim()
    ? `\nBISHERIGER PROMPT — den verbesserst du jetzt, du fängst nicht von vorn an:\n"""${previous.trim()}"""`
    : "";

  const answerLine = answers.length
    ? `\nSEINE ANTWORTEN AUF DEINE FRAGEN: ${answers.join(" · ")}`
    : "";

  const noteLine = note.trim() ? `\nSEIN NACHWORT — das muss jetzt besser rein:\n"""${note.trim()}"""` : "";

  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `Du bist der Prompt-Meister für ${kind}-KI. Du machst aus einer rohen Beschreibung einen fertigen Prompt — und fragst danach so lange nach, bis er genau das trifft, was der Nutzer will.

AUFGABE:
1. Schreibe EINEN einzigen, sehr detaillierten Prompt für ${kind}.
   - Sprache: Englisch.${isText ? " In ganzen Sätzen, als klare Anweisung." : " Knapp und konkret, kommagetrennt, mit Kamerawinkel, Licht, Stimmung und Hintergrund."}
   - Jede Vorgabe übernehmen: Ort, Pose, Kleidung, Handlung, Licht, Stimmung. Nichts erfinden, was widerspricht, und nichts doppelt nennen.
   - Kein Vorwort, keine Erklärungen, keine Anführungszeichen, keine Überschriften. Nur der Prompt selbst.
2. Stelle danach 2 bis 3 kurze Rückfragen auf DEUTSCH, mit denen der Prompt noch genauer wird — zum Beispiel Blickwinkel, Licht, Outfit, Ort, Stimmung, Detailtiefe. Gib zu jeder Frage 3 kurze Antworten, die man antippen kann (je 2 bis 4 Wörter).
   - Ist schon alles klar, gib eine leere Fragenliste zurück.
   - Stelle keine Frage, deren Antwort schon im Prompt steht.
${styleLine}${personLine}${syntaxLine}${prevLine}${answerLine}${noteLine}

DAS GESAGTE (Deutsch, ungeordnet):
"""${prompt.trim()}"""`,
    response_json_schema: {
      type: "object",
      properties: {
        prompt: { type: "string" },
        questions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              question: { type: "string" },
              options: { type: "array", items: { type: "string" } },
            },
            required: ["question"],
          },
        },
      },
      required: ["prompt"],
    },
  });

  return {
    prompt: res?.prompt || "",
    questions: Array.isArray(res?.questions) ? res.questions.filter((q) => q?.question) : [],
  };
}