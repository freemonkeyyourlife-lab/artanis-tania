// Die Emotionsproben: für jede Stimmung ein Satz zum Einsprechen und die
// Werte, die daraus später Tonlage, Tempo und Intensität der Stimme formen.

export const EMOTIONS = [
  {
    id: "RUHIG",
    label: "Ruhig",
    hint: "erzählend, neutral",
    prompt: "Hey, schön dass du da bist. Ich erzähl dir einfach mal, wie mein Tag war.",
    mood: "NEUTRAL", speed: 1, depth: 0, intensity: 35,
  },
  {
    id: "SANFT",
    label: "Sanft",
    hint: "warm, zugewandt",
    prompt: "Komm her … bleib noch ein bisschen, ja? Ich mag es, wenn du da bist.",
    mood: "SANFT", speed: 0.92, depth: -6, intensity: 45,
  },
  {
    id: "VERFUEHRERISCH",
    label: "Verführerisch",
    hint: "tief, langsam",
    prompt: "Du merkst schon, dass ich dich die ganze Zeit ansehe … und du siehst es auch.",
    mood: "VERFUEHRERISCH", speed: 0.88, depth: -14, intensity: 70,
  },
  {
    id: "ERREGT",
    label: "Erregt",
    hint: "heiß, atmend",
    prompt: "Oh … ja, genau so. Nicht aufhören, bitte.",
    mood: "HEISS", speed: 0.94, depth: -22, intensity: 95,
  },
  {
    id: "SPIELERISCH",
    label: "Spielerisch",
    hint: "frech, leicht",
    prompt: "Na? Traust du dich, oder soll ich anfangen?",
    mood: "SPIELERISCH", speed: 1.1, depth: 8, intensity: 60,
  },
  {
    id: "ERSCHROCKEN",
    label: "Erschrocken",
    hint: "hoch, schnell",
    prompt: "Was … was war das denn? Erschrick mich doch nicht so!",
    mood: "SPIELERISCH", speed: 1.16, depth: 10, intensity: 75,
  },
  {
    id: "ERNST",
    label: "Ernst",
    hint: "tief, fest",
    prompt: "Hör mir kurz zu. Das ist mir wichtig, und ich meine es ernst.",
    mood: "ERNST", speed: 0.96, depth: -24, intensity: 55,
  },
  {
    id: "HART",
    label: "Hart",
    hint: "bestimmend",
    prompt: "Genug. Du machst jetzt genau das, was ich dir sage.",
    mood: "HART", speed: 1.04, depth: -32, intensity: 85,
  },
];

export const emotionLabel = (id) => (EMOTIONS.find((e) => e.id === id) || {}).label || id;

export const emotionById = (id) => EMOTIONS.find((e) => e.id === id) || EMOTIONS[0];

// Aus den gemachten Proben die Grundstimmung ableiten: die Emotion, von der
// am meisten aufgenommen wurde, bestimmt Tonlage, Tempo und Intensität.
export function buildTuningFromSamples(samples = []) {
  const counts = new Map();
  samples.forEach((s) => counts.set(s.emotion, (counts.get(s.emotion) || 0) + 1));
  let topId = null;
  let top = 0;
  counts.forEach((n, id) => { if (n > top) { top = n; topId = id; } });
  const e = emotionById(topId);
  return { mood: e.mood, speed: e.speed, depth: e.depth, intensity: e.intensity, label: e.label };
}