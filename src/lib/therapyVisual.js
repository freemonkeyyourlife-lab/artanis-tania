// Prompt-Bausteine, um eine Therapie-Szene als Bild oder Video zu fassen.
// Nimmt Ort, Besetzung, Thema und die letzte Szene auf — ohne reale Personen.

const castLine = (session) =>
  (session.cast || [])
    .filter((c) => c && (c.name || c.appearance || c.setting))
    .map((c) => {
      const nm = c.name || "Person";
      const appear = c.appearance || c.setting || "";
      return appear ? `${nm} (${appear})` : nm;
    })
    .join(", ");

export const sceneImagePrompt = (session, sceneText) => {
  const parts = [];
  if (session.location) parts.push(`Ort: ${session.location}`);
  const cast = castLine(session);
  if (cast) parts.push(`Anwesend: ${cast}`);
  if (session.topic) parts.push(`Thema: ${session.topic}`);
  if (session.intensity) parts.push(`Intensität: ${session.intensity}`);
  if (sceneText) parts.push(`Szene: ${String(sceneText).slice(0, 600)}`);
  return `Kinorealistisches Standbild einer intimen Szene. ${parts.join(". ")}. Erwachsene Personen ab 18, einvernehmlich. Stimmungsvolles Licht, weicher Fokus, fotografisch. Keine realen Personen, keine Gesichter erkennbarer Prominenter.`;
};

export const sceneVideoPrompt = (session, sceneText) => {
  const parts = [];
  if (session.location) parts.push(`Ort: ${session.location}`);
  const cast = castLine(session);
  if (cast) parts.push(`Anwesend: ${cast}`);
  if (sceneText) parts.push(`Szene: ${String(sceneText).slice(0, 400)}`);
  return `Kurzer cinematischer Clip einer intimen Szene. ${parts.join(". ")}. Erwachsene Personen ab 18, einvernehmlich. Sanfte Kamerabewegung, stimmungsvoll, kein hörbarer Dialog.`;
};