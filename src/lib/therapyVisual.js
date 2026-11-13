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

// Referenzbilder der Originalcharaktere dieser Sitzung — Therapeutin, Akteur
// und anwesende Gäste. Sie geben jedem Bild und Video vor, wie die Personen
// aussehen, damit sie überall gleich bleiben.
export const charRefImages = (session) => {
  const refs = [];
  if (session?.therapistAvatar) refs.push(session.therapistAvatar);
  if (session?.actor?.active && session.actor?.avatar) refs.push(session.actor.avatar);
  (session?.cast || []).forEach((c) => { if (c?.avatar) refs.push(c.avatar); });
  return [...new Set(refs.filter(Boolean))];
};

export const CHAR_CONSISTENCY =
  " KONSISTENZ (verbindlich): Jede Person sieht EXAKT so aus wie in ihren Referenzbildern — selbes Gesicht, selbe Haarfarbe und -länge, selber Hautton, selber Körper, dieselbe Kleidung. Keine abweichende Person, kein anderes Aussehen. Die Referenzbilder sind die Wahrheit.";

export const sceneImagePrompt = (session, sceneText) => {
  const parts = [];
  if (session.location) parts.push(`Ort: ${session.location}`);
  const cast = castLine(session);
  if (cast) parts.push(`Anwesend: ${cast}`);
  if (session.topic) parts.push(`Thema: ${session.topic}`);
  if (session.intensity) parts.push(`Intensität: ${session.intensity}`);
  if (sceneText) parts.push(`Szene: ${String(sceneText).slice(0, 600)}`);
  return `Kinorealistisches Standbild einer intimen Szene. ${parts.join(". ")}. Erwachsene Personen ab 18, einvernehmlich. Stimmungsvolles Licht, weicher Fokus, fotografisch. Keine realen Personen, keine Gesichter erkennbarer Prominenter.${CHAR_CONSISTENCY}`;
};

export const sceneVideoPrompt = (session, sceneText) => {
  const parts = [];
  if (session.location) parts.push(`Ort: ${session.location}`);
  const cast = castLine(session);
  if (cast) parts.push(`Anwesend: ${cast}`);
  if (sceneText) parts.push(`Szene: ${String(sceneText).slice(0, 400)}`);
  return `Kurzer cinematischer Clip einer intimen Szene. ${parts.join(". ")}. Erwachsene Personen ab 18, einvernehmlich. Sanfte Kamerabewegung, stimmungsvoll, kein hörbarer Dialog.${CHAR_CONSISTENCY}`;
};