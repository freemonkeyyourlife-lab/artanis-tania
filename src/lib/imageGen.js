import { base44 } from "@/api/base44Client";

// Ein Weg für alle Bildmodelle: fal.ai, Hugging Face und Pollinations.
// Jedes Modell kennt seine Quelle selbst — hier wird nur weitergeleitet.
// Mit Vorlagebild bauen die Bild-zu-Bild-Modelle daraus um, die übrigen
// erzeugen aus dem Prompt allein.
export async function generateWithModel(model, prompt, aspect = "portrait", imageUrl = null) {
  const fn = model.source === "FAL_AI" ? "falGenerate" : "hfGenerate";
  const res = await base44.functions.invoke(fn, {
    modelId: model.modelId,
    source: model.source,
    prompt,
    aspect,
    imageUrl: imageUrl || undefined,
  });
  if (res.data?.error) throw new Error(res.data.error);
  return res.data.imageUrl;
}