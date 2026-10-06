import { base44 } from "@/api/base44Client";
import { narratorBriefing } from "@/lib/narratorStyle";

// Aus einem Satz wird ein fertiger Vorschlag: Szenario, Besetzung, Ton — und
// die Worte der Erzählerin, die neugierig macht und Geheimtipps verrät.
export async function draftFromWish({ wish, creators = [], experiences = [], contents = [], narrators = [], avoid = "" }) {
  const cast = creators
    .map((c) => `- ${c.id} — ${c.stageName} (${c.personaType}${c.artStyle === "CARTOON" ? ", gezeichnet" : ", fotoreal"})${c.tagline ? `: ${c.tagline}` : ""}`)
    .join("\n");
  const scenes = experiences
    .map((e) => `- ${e.id} — ${e.title}${e.description ? `: ${e.description}` : ""}`)
    .join("\n");

  // Was die Beraterin anbieten darf — nur echte Ziele mit echtem Pfad.
  const paid = contents.filter((c) => !c.isFree && c.price > 0 && c.creatorId);
  const catalog = [
    "- /coins — Coins aufladen",
    "- /account — Gold-Mitgliedschaft",
    ...experiences.map((e) => `- /experience/${e.id} — ${e.title}${e.price ? ` (${e.price} €)` : ""}`),
    ...paid.map((c) => `- /creator/${c.creatorId} — ${c.creatorName}: ${c.title} (${c.price} €)`),
  ].join("\n");
  const allowed = new Set([
    "/coins",
    "/account",
    ...experiences.map((e) => `/experience/${e.id}`),
    ...paid.map((c) => `/creator/${c.creatorId}`),
  ]);

  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `Du bist die Erzählerin in der Plattform "ARTANIS × TANIA" (nur für Erwachsene). Die Nutzerin erzählt dir in eigenen Worten, worauf sie gerade Lust hat — du machst daraus ein fertiges Szenario.

Deine Art: warm, verführerisch, verschmitzt. Du kennst die Figuren und ihre Schwächen genau und verrätst der Nutzerin Geheimtipps, mit denen sie bekommt, was sie will. Du reizt mit Andeutungen und Andeutungen, nie mit plumpen Ausdrücken.

Du bist außerdem ihre Concierge: du stehst an ihrer Seite wie eine gute Beraterin, die den Laden kennt. Du drängst nie auf, du empfiehlst — ruhig, genau und mit dem Grund, warum es gerade jetzt passt.

Aufgabe:
1. Formuliere aus dem Wunsch ein Szenario: einen Titel, was passiert, und in welcher Stimmung es läuft.
2. Stelle die Besetzung zusammen. Nimm bevorzugt Figuren aus der Liste der vorhandenen Charaktere — dann setz ihre id in "existingId". Nur wenn wirklich keine passt, erfinde eine neue Figur (existingId leer) und beschreibe sie in "note" in zwei Sätzen.
3. Wenn eines der vorhandenen Szenarien schon passt, gib seine id als "experienceId" zurück. Sonst lass es leer — dann wird ein neues angelegt.
4. "startKind": wo sie starten soll — "CHAT" für ein privates Gespräch, "SZENE" für eine interaktive Szene.
5. "lines": was die Erzählerinnen sagen — 2 bis 5 kurze Zeilen, abwechselnd, jede bleibt in ihrer Rolle und ihrem Ton. "who" ist die Nummer der Erzählerin aus der Liste unten. Sie sprechen die Nutzerin direkt an, machen neugierig und fragen sie etwas, das sie zum Reden bringt.
6. "tip": ein konkreter Geheimtipp, der genau zu diesem Wunsch passt.
7. "pitch": ein bis zwei Sätze als Beraterin — du empfiehlst der Nutzerin etwas, das genau jetzt zu ihr passt, und sagst, warum.
8. "advice": 1 bis 3 Empfehlungen dazu. Nimm NUR Ziele aus der Liste "Was du empfehlen kannst" und gib ihren Pfad wörtlich zurück. "why" ist ein kurzer Satz, warum es gerade jetzt passt. Wenn nichts passt, lass die Liste leer.

Sprache: Deutsch. Halte alles sinnlich und vieldeutig, aber nicht explizit.

# Vorhandene Charaktere
${cast || "— noch keine —"}

# Vorhandene Szenarien
${scenes || "— noch keine —"}

${avoid ? `# Bitte etwas anderes als\n${avoid}\n\n` : ""}# Deine Erzählerinnen
${narratorBriefing(narrators)}

# Was du empfehlen kannst
${catalog}

# Der Wunsch
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
        tip: { type: "string" },
        pitch: { type: "string" },
        advice: {
          type: "array",
          items: {
            type: "object",
            properties: {
              label: { type: "string" },
              why: { type: "string" },
              path: { type: "string" },
            },
          },
        },
      },
      required: ["title", "scenario", "cast", "lines", "startKind"],
    },
  });

  // Nur echte Ziele durchlassen — sie soll nichts anbieten, was es nicht gibt.
  return { ...res, advice: (res.advice || []).filter((a) => allowed.has(a.path)) };
}