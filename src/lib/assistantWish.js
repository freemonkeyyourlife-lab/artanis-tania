import { base44 } from "@/api/base44Client";

// Aus einem Satz wird ein fertiger Vorschlag: Szenario, Besetzung, Ton — und
// die Worte der Erzählerin, die neugierig macht und Geheimtipps verrät.
export async function draftFromWish({ wish, creators = [], experiences = [], avoid = "" }) {
  const cast = creators
    .map((c) => `- ${c.id} — ${c.stageName} (${c.personaType}${c.artStyle === "CARTOON" ? ", gezeichnet" : ", fotoreal"})${c.tagline ? `: ${c.tagline}` : ""}`)
    .join("\n");
  const scenes = experiences
    .map((e) => `- ${e.id} — ${e.title}${e.description ? `: ${e.description}` : ""}`)
    .join("\n");

  return base44.integrations.Core.InvokeLLM({
    prompt: `Du bist die Erzählerin in der Plattform "ARTANIS × TRIANIA" (nur für Erwachsene). Die Nutzerin erzählt dir in eigenen Worten, worauf sie gerade Lust hat — du machst daraus ein fertiges Szenario.

Deine Art: warm, verführerisch, verschmitzt. Du kennst die Figuren und ihre Schwächen genau und verrätst der Nutzerin Geheimtipps, mit denen sie bekommt, was sie will. Du reizt mit Andeutungen und Andeutungen, nie mit plumpen Ausdrücken.

Aufgabe:
1. Formuliere aus dem Wunsch ein Szenario: einen Titel, was passiert, und in welcher Stimmung es läuft.
2. Stelle die Besetzung zusammen. Nimm bevorzugt Figuren aus der Liste der vorhandenen Charaktere — dann setz ihre id in "existingId". Nur wenn wirklich keine passt, erfinde eine neue Figur (existingId leer) und beschreibe sie in "note" in zwei Sätzen.
3. Wenn eines der vorhandenen Szenarien schon passt, gib seine id als "experienceId" zurück. Sonst lass es leer — dann wird ein neues angelegt.
4. "startKind": wo sie starten soll — "CHAT" für ein privates Gespräch, "SZENE" für eine interaktive Szene.
5. "narrator": deine Begrüßung, 2 bis 4 Sätze. Du sprichst die Nutzerin direkt an, machst neugierig und fragst sie etwas, das sie zum Reden bringt.
6. "tip": ein konkreter Geheimtipp, der genau zu diesem Wunsch passt.

Sprache: Deutsch. Halte alles sinnlich und vieldeutig, aber nicht explizit.

# Vorhandene Charaktere
${cast || "— noch keine —"}

# Vorhandene Szenarien
${scenes || "— noch keine —"}

${avoid ? `# Bitte etwas anderes als\n${avoid}\n\n` : ""}# Der Wunsch
${wish}`,
    response_json_schema: {
      type: "object",
      properties: {
        title: { type: "string" },
        scenario: { type: "string" },
        mood: { type: "string" },
        startKind: { type: "string", enum: ["CHAT", "SZENE"] },
        experienceId: { type: "string" },
        cast: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              existingId: { type: "string" },
              personaType: { type: "string", enum: ["SOLO_MALE", "SOLO_FEMALE", "SHEMALE", "COUPLE", "GROUP"] },
              artStyle: { type: "string", enum: ["PHOTOREAL", "CARTOON"] },
              role: { type: "string" },
              note: { type: "string" },
            },
          },
        },
        narrator: { type: "string" },
        tip: { type: "string" },
      },
      required: ["title", "scenario", "cast", "narrator", "startKind"],
    },
  });
}