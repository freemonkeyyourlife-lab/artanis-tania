import { base44 } from "@/api/base44Client";

// Erzeugt ein Bild für einen Charakter. Solange kein LoRA trainiert ist,
// greift die Standard-Generierung — die erfindet gerne eine zweite Person
// oder ein fremdes Gesicht. Deshalb geben wir ihr 1–2 echte Fotos der
// Person als Referenz mit (existing_image_urls) und verlangen im Prompt
// eine einzelne Frau als einziges Motiv im Alltag. Ist das Set auf FERTIG
// trainiert, läuft die Generierung stattdessen über den RunPod-Pod, der
// die LoRA-Datei lädt (runpodGenerate).
//
// ctxPrompt   — der Charakter-Kontext (Name, Aussehen, Persönlichkeit …)
// scenePrompt — die konkrete Szene/Pose/Outfit

async function refUrls(set) {
  // Haupt-Charakter priorisieren: wenn focusStrict an ist, dient NUR das
  // Fokus-Bild als Referenz — keine anderen Fotos, die eine zweite Person
  // einschleppen könnten. Sonst wie gehabt bis zu zwei Fotos.
  const strict = set?.focusStrict !== false && !!set?.focusImage;
  const raw = strict
    ? [set?.focusImage]
    : [set?.focusImage, ...(set?.images || []), ...(set?.generatedImages || [])].filter(Boolean);
  const picked = [];
  const seen = new Set();
  for (const u of raw) {
    if (picked.length >= 2) break;
    const key = u.split("?")[0];
    if (seen.has(key)) continue;
    seen.add(key);
    if (u.startsWith("http")) { picked.push(u); continue; }
    try {
      const s = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: u, expires_in: 1800 });
      if (s?.signed_url) picked.push(s.signed_url);
    } catch { /* private Uri nicht signierbar — überspringen */ }
  }
  return picked;
}

export async function generateCharImage(set, ctxPrompt, scenePrompt) {
  const scene = scenePrompt || "Alltagssituation";
  const strict = set?.focusStrict !== false;
  // Wacht: genau eine Frau, keine zweiten Personen, klares Hauptmotiv.
  // Im Strict-Modus noch schärfer: dieselbe Person wie im Referenzfoto,
  // keine fremden Gesichter, keine Doppelgänger, kein Gesichtstausch.
  const guard = strict
    ? "Foto von genau einer einzigen Frau, exakt dieselbe Person wie im Referenzfoto, nur ein Gesicht im Bild, keine zweiten oder dritten Personen, keine fremden Gesichter, keine Doppelgänger, kein Gesichtstausch, die Frau ist das einzige und klare Hauptmotiv. "
    : "Foto einer einzelnen Frau, nur eine Person im Bild, keine weiteren Menschen, die Frau ist das klare Hauptmotiv. ";
  const full = `${guard}${ctxPrompt}\n\nSzene: ${scene}. Bildstil: fotorealistisch, stimmungsvoll, durchgearbeitet.`;
  const trained = set?.trainStatus === "FERTIG" && !!set?.trainJobId;
  if (trained) {
    const res = await base44.functions.invoke("runpodGenerate", { setId: set.id, prompt: full });
    if (res?.data?.error) throw new Error(res.data.error);
    return res?.data?.imageUrl;
  }
  const refs = await refUrls(set);
  const res = await base44.integrations.Core.GenerateImage({
    prompt: full,
    ...(refs.length ? { existing_image_urls: refs } : {}),
  });
  return res?.url;
}