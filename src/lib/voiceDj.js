// Die Stimmbank: eine Handvoll Grundstimmen plus ein Regler-Modul,
// das daraus die jeweils passende Stimme macht.

export const BASE_VOICES = [
  { id: "river", label: "River", hint: "ruhig & neutral" },
  { id: "honey", label: "Honey", hint: "warm & weich" },
  { id: "sunny", label: "Sunny", hint: "hell & lebendig" },
  { id: "storm", label: "Storm", hint: "tief & bestimmt" },
  { id: "spark", label: "Spark", hint: "schnell & frech" },
];

// Der Stimmen-DJ: eine Stimmung antippen — Tempo und Tiefe stellen sich passend ein.
export const MOODS = [
  { id: "NEUTRAL", label: "Neutral", speed: 1, depth: 0 },
  { id: "SANFT", label: "Sanft", speed: 0.92, depth: -6 },
  { id: "VERFUEHRERISCH", label: "Verführerisch", speed: 0.88, depth: -14 },
  { id: "HEISS", label: "Heiß", speed: 0.94, depth: -22 },
  { id: "SPIELERISCH", label: "Spielerisch", speed: 1.1, depth: 8 },
  { id: "ERNST", label: "Ernst", speed: 0.96, depth: -24 },
  { id: "HART", label: "Hart", speed: 1.04, depth: -32 },
];

export const moodPreset = (id) => MOODS.find((m) => m.id === id) || MOODS[0];

export const baseVoiceLabel = (id) => (BASE_VOICES.find((v) => v.id === id) || BASE_VOICES[0]).label;

// Für ElevenLabs-Stimmen: Tonlage wird beim Abspielen verschoben, das Tempo
// wird vorher so ausgeglichen, dass es am Ende genau passt.
export function cloudTuning(profile) {
  const speed = typeof profile?.speed === "number" ? profile.speed : 1;
  const depth = typeof profile?.depth === "number" ? profile.depth : 0;
  const pitch = Math.max(0.75, Math.min(1.25, 1 + depth / 100));
  return {
    pitch,
    apiSpeed: Math.max(0.7, Math.min(1.2, speed / pitch)),
    intensity: typeof profile?.intensity === "number" ? profile.intensity : undefined,
  };
}

// Der Feinschliff einer Stimme, so wie er ans Sprechen weitergegeben wird.
// −1 oder nichts Gesetztes heißt: der Klang folgt weiter der Stimmung.
export function fineTuning(profile) {
  const p = profile || {};
  const value = (v) => (typeof v === "number" && v >= 0 ? v : undefined);
  return {
    stability: value(p.stability),
    style: value(p.style),
    similarity: value(p.similarity),
    presence: p.presence !== false,
  };
}

// Lautstärke aus der Stimmbank (0–100) in den Reglerwert fürs Abspielen (0–1).
export function playVolume(profile) {
  const v = Number(profile?.volume);
  return Math.max(0, Math.min(1, (Number.isFinite(v) ? v : 100) / 100));
}

// Aus einem Stimmbank-Profil die fertigen Werte fürs Vorlesen machen.
export function resolveVoice(profile) {
  const base = BASE_VOICES.find((v) => v.id === profile?.baseVoice) || BASE_VOICES[0];
  const mood = moodPreset(profile?.mood);
  const speed = typeof profile?.speed === "number" ? profile.speed : 1;
  const depth = typeof profile?.depth === "number" ? profile.depth : 0;
  const pitch = Math.max(0.5, Math.min(1.6, 1 + depth / 100));
  return {
    baseVoice: base.id,
    label: `${base.label} · ${mood.label}`,
    rate: speed,
    pitch,
    // Für abgespielte Aufnahmen: Tempo und Tiefe in einem Reglerwert.
    audioRate: Math.max(0.5, Math.min(2, speed * pitch)),
  };
}