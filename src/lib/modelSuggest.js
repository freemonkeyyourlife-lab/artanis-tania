import { modelStrength } from "@/lib/modelStrengths";

// Liest aus dem Prompt, worauf es gerade ankommt — und sucht dazu die Modelle,
// die genau das können. So steht der beste Griff oben, ohne langes Scrollen.

const NEEDS = [
  { need: "Anime", words: ["anime", "gezeichnet", "manga", "comic", "illustration", "zeichentrick", "cartoon"] },
  { need: "Fotoreal", words: ["fotoreal", "fotorealistisch", "foto", "photo", "realistisch", "realistic", "echt", "8k", "dslr"] },
  { need: "Gesichter", words: ["gesicht", "face", "porträt", "portrait", "nah", "close-up", "closeup", "augen", "blick"] },
  { need: "Körper & Haut", words: ["körper", "body", "haut", "skin", "nackt", "nude", "dessous", "negligee", "reizwäsche", "lingerie", "kurven", "brüste", "beine"] },
  { need: "Freizügig", words: ["freizügig", "erotisch", "erotic", "explizit", "explicit", "heiß", "sinnlich", "sensual", "sexy", "verführerisch", "seductive"] },
  { need: "Hält ihr Gesicht", words: ["vorlage", "reference", "same person", "gleiche person", "dieselbe", "gesicht bleibt", "umbauen", "pose", "neue pose"] },
  { need: "Prompt-treu", words: ["szene", "scene", "raum", "zimmer", "flur", "hallway", "wohnung", "interior", "hintergrund", "background", "landschaft", "stadt"] },
  { need: "Schnell", words: ["schnell", "schneller", "entwurf", "test", "viele", "variation"] },
];

// Was der Prompt verlangt: alle Etiketten, die im Text vorkommen.
export function promptNeeds(prompt = "") {
  const hay = prompt.toLowerCase();
  return NEEDS.filter((n) => n.words.some((w) => hay.includes(w))).map((n) => n.need);
}

// Die Modelle, die am besten zu dem passen, was im Prompt steht. Gleichstand
// entscheidet der Favorit.
export function suggestModels(models = [], prompt = "", limit = 3) {
  const needs = promptNeeds(prompt);
  if (!needs.length) return [];
  return (models || [])
    .map((m) => {
      const chips = modelStrength(m).chips || [];
      const hits = needs.filter((n) => chips.includes(n));
      return { model: m, hits, score: hits.length * 2 + (m.favorite ? 1 : 0) };
    })
    .filter((r) => r.score > 0 && r.hits.length)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}