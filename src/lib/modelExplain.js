import { base44 } from "@/api/base44Client";

// Eine kurze, brauchbare Erklärung je Modell: was es kann und wofür es taugt.
// Damit wählt man für jedes Bild oder Video das passende Modell aus.
export async function explainModel({ name, modelId, source, kind = "BILD" }) {
  const res = await base44.integrations.Core.InvokeLLM({
    prompt: `Du erklärst ${kind === "VIDEO" ? "Videomodelle" : "Bildmodelle"} für einen Generator.

Modell: ${name}
Kennung: ${modelId}
Plattform: ${source || "unbekannt"}

Schreibe auf Deutsch 2 bis 3 kurze Sätze, ohne Aufzählung und ohne Überschrift. Sag konkret, was das Modell gut kann (zum Beispiel realistische Gesichter, schnelle Entwürfe, Anime-Stil, flüssige Bewegung) und wofür man es am besten einsetzt. Kennst du das Modell nicht sicher, beschreibe vorsichtig, was die Kennung nahelegt — erfinde keine Details.`,
    response_json_schema: {
      type: "object",
      properties: { description: { type: "string" } },
      required: ["description"],
    },
  });
  return (res?.description || "").trim();
}