import { base44 } from "@/api/base44Client";

// Erzeugt ein Bild für einen Charakter — und zwar mit dem trainierten LoRA,
// wenn das Set auf FERTIG steht (trainStatus FERTIG + trainJobId). Dann läuft
// die Generierung über den RunPod-Pod (runpodGenerate), der die LoRA-Datei
// lädt. Ohne fertiges LoRA fällt es auf die Standard-GenerateImage zurück,
// damit die Resultate-Seite auch ohne GPU funktioniert.
//
// ctxPrompt   — der Charakter-Kontext (Name, Aussehen, Persönlichkeit …)
// scenePrompt — die konkrete Szene/Pose/Outfit
export async function generateCharImage(set, ctxPrompt, scenePrompt) {
  const full = `${ctxPrompt}${scenePrompt ? `\n\nSzene: ${scenePrompt}.` : ""}. Bildstil: fotorealistisch, stimmungsvoll, durchgearbeitet.`;
  const trained = set?.trainStatus === "FERTIG" && !!set?.trainJobId;
  if (trained) {
    const res = await base44.functions.invoke("runpodGenerate", { setId: set.id, prompt: full });
    if (res?.data?.error) throw new Error(res.data.error);
    return res?.data?.imageUrl;
  }
  const res = await base44.integrations.Core.GenerateImage({ prompt: full });
  return res?.url;
}