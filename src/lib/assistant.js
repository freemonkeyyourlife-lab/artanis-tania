import { syncCreatorGalleries } from "@/lib/gallery";
import { presetFor } from "@/lib/modelPrompts";

// Bilder nachladen: was ein Charakter an Bildern schon hat, wandert in seine
// Galerie. Was danach noch leer ist, wird gemeldet — dort gibt es keine Quelle,
// da hilft nur das Externe Studio.
export async function reloadImages(creators = []) {
  const added = await syncCreatorGalleries(creators);
  const without = creators.filter((c) => !c.avatar && !(c.referenceImages || []).length);
  return { added, without };
}

// Nur eingeschaltete Bild-Modelle, jedes mit seiner Prompt-Sprache.
export const usableModels = (models = []) =>
  models.filter((m) => m.enabled !== false).map((m) => ({ model: m, preset: presetFor(m) }));

const ANIME = ["PONY", "ILLUSTRIOUS"];

// Der Stil des Charakters gibt die Richtung vor: gezeichnet → Zeichen-Modelle,
// fotoreal → Foto-Modelle.
export function suggestModel(entries = [], creator) {
  if (!entries.length) return null;
  const cartoon = creator?.artStyle === "CARTOON";
  return (
    entries.find((e) => (cartoon ? ANIME.includes(e.preset.id) : !ANIME.includes(e.preset.id))) || entries[0]
  );
}

const lower = (v) => String(v || "").toLowerCase();

// Bausteine zum Charakter: gleicher Name zuerst, dann gemeinsame Schlagworte.
export function suggestBlocks(blocks = [], creator) {
  if (!creator) return blocks;
  const name = lower(creator.stageName);
  const tags = new Set((creator.tags || []).map(lower));
  const score = (b) => {
    let s = b.personaName && lower(b.personaName) === name ? 3 : 0;
    s += (b.tags || []).filter((t) => tags.has(lower(t))).length;
    return s;
  };
  return [...blocks].sort((a, b) => score(b) - score(a));
}

// Stimme zum Charakter: gleiche Schlagworte zuerst, sonst die erste.
export function suggestVoice(voices = [], creator) {
  if (!voices.length) return null;
  const tags = new Set([...(creator?.tags || []), ...(creator?.topics || [])].map(lower));
  return voices.find((v) => (v.tags || []).some((t) => tags.has(lower(t)))) || voices[0];
}

// Aus den gewählten Bausteinen wird Beschreibung für den Prompt.
export const blocksToText = (blocks = []) =>
  blocks
    .map((b) => [b.situation, ...(b.activeVariants || [])].filter(Boolean).join(", "))
    .filter(Boolean)
    .join(" · ");