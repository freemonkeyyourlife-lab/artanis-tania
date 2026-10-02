// Erkennt aus dem Dateinamen, wer und was drin ist: der Charakter und die
// Story-Kategorie. Alles, was hier herauskommt, ist ein Vorschlag — im
// Massen-Import steht er sichtbar an jeder Datei und lässt sich ändern.

const SEPARATORS = /[\s._\-–—+()[\]#]+/;

export const nameWords = (name) =>
  String(name || "")
    .replace(/\.[a-z0-9]{2,4}$/i, "")
    .toLowerCase()
    .split(SEPARATORS)
    .filter((w) => w.length > 2);

// Wörter, die die Art der Datei verraten.
const KIND_WORDS = [
  { words: ["teaser", "trailer", "vorschau", "preview", "anreisser", "anreißer", "sneak"], kind: "TEASER" },
  { words: ["set", "serie", "sammlung", "gallery", "galerie", "reihe"], kind: "PHOTO_SET" },
];

// Wörter, die das Thema verraten — daraus wird die Story-Kategorie.
const TOPIC_WORDS = [
  { words: ["dusche", "shower", "badezimmer"], topic: "Dusche" },
  { words: ["bett", "bed", "schlafzimmer", "bedroom", "bettkante"], topic: "Schlafzimmer" },
  { words: ["strand", "beach", "pool", "meer", "see"], topic: "Strand" },
  { words: ["outfit", "kleid", "dessous", "lingerie", "waesche", "wäsche", "reizwaesche"], topic: "Outfit" },
  { words: ["buero", "büro", "office", "schreibtisch"], topic: "Büro" },
  { words: ["kueche", "küche", "kitchen"], topic: "Küche" },
  { words: ["auto", "car", "fahrt", "unterwegs"], topic: "Unterwegs" },
  { words: ["party", "feier", "club", "disco"], topic: "Party" },
  { words: ["massage", "oel", "öl", "wellness"], topic: "Massage" },
  { words: ["spielzeug", "toy"], topic: "Spielzeug" },
  { words: ["strip", "striptease", "tanz", "dance", "pole"], topic: "Tanz" },
  { words: ["nacht", "night", "dunkel", "mitternacht"], topic: "Nacht" },
  { words: ["morgen", "morning", "aufwachen", "wake", "fruehstueck", "frühstück"], topic: "Morgen" },
  { words: ["selfie", "nahaufnahme", "closeup", "portrait", "portraet", "porträt"], topic: "Nahaufnahme" },
  { words: ["training", "gym", "sport", "yoga"], topic: "Sport" },
  { words: ["rollenspiel", "roleplay", "szene", "scene"], topic: "Rollenspiel" },
  { words: ["kuss", "kiss", "zaertlich", "zärtlich", "streicheln"], topic: "Zärtlichkeit" },
  { words: ["hard", "hart", "intensiv", "wild"], topic: "Intensiv" },
  { words: ["pov", "erste", "perspektive"], topic: "POV" },
];

const KINDS = ["PHOTO", "PHOTO_SET", "VIDEO", "TEASER", "AUDIO"];

export function guessKind(name, fallback = "PHOTO") {
  const w = nameWords(name);
  for (const rule of KIND_WORDS) {
    if (rule.words.some((x) => w.includes(x))) {
      // Eine Fotoserie bleibt eine Fotoserie, alles andere wird zum Teaser.
      if (rule.kind === "PHOTO_SET") return fallback === "PHOTO" ? "PHOTO_SET" : fallback;
      return "TEASER";
    }
  }
  return KINDS.includes(fallback) ? fallback : "PHOTO";
}

export function guessTopics(name) {
  const w = nameWords(name);
  const out = [];
  TOPIC_WORDS.forEach((rule) => {
    if (rule.words.some((x) => w.includes(x)) && !out.includes(rule.topic)) out.push(rule.topic);
  });
  return out;
}

// Der Charakter steht im Dateinamen — „triania_dusche_03.mp4" findet Triania.
export function guessCreator(name, creators = []) {
  const set = new Set(nameWords(name));
  if (!set.size) return null;
  let best = null;
  creators.forEach((c) => {
    const parts = nameWords(c.stageName);
    if (!parts.length || !parts.every((p) => set.has(p))) return;
    const score = parts.join("").length;
    if (!best || score > best.score) best = { creator: c, score };
  });
  return best ? best.creator : null;
}

// Ein Aufruf: Datei rein, Zuordnung raus.
export function autoTag(name, creators = [], fallbackKind = "PHOTO") {
  const creator = guessCreator(name, creators);
  const topics = guessTopics(name);
  const kind = guessKind(name, fallbackKind);
  const reasons = [];
  if (creator) reasons.push(`Name passt zu „${creator.stageName}“`);
  if (topics.length) reasons.push(`Thema ${topics.join(", ")}`);
  if (kind !== fallbackKind) reasons.push(kind === "TEASER" ? "als Teaser erkannt" : "als Fotoserie erkannt");
  return {
    creatorId: creator ? creator.id : "",
    creatorName: creator ? creator.stageName : "",
    topics,
    kind,
    reason: reasons.join(" · "),
  };
}