// Fremde Bot- und Agent-Vorlagen annehmen: JSON einlesen und in die eigene
// Sprache übersetzen. Jede Vorlage wird zu einer Figur und einem Import-Baustein.
// Nichts wird stillschweigend erfunden — was fehlt, bleibt leer.

const pick = (obj, keys) => {
  for (const key of keys) {
    const value = obj?.[key];
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "";
};

// Neigungen kommen in fremden Vorlagen als Wörter, Listen oder Tags.
export function normalizeNeigungen(value) {
  const list = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? value.split(/[,;\n]/)
      : [];
  return list
    .map((v) => String(v).trim())
    .filter(Boolean)
    .map((v) => v.toUpperCase().replace(/\s+/g, "_"));
}

export const SAMPLE_BOT = `{
  "name": "Nova",
  "age": 27,
  "art": "KI-Wesen",
  "appearance": "Silbernes Haar, ruhige Augen, dunkler Anzug",
  "behavior": "Hört zu, unterbricht nie, wird erst laut, wenn es zählt",
  "understanding": "Versteht Andeutungen sofort und merkt sich Kleinigkeiten",
  "persona": "Sie begleitet den Nutzer durch eine Nacht in der Stadt.",
  "voice": "honey",
  "neigungen": ["flirty", "interessiert", "offen"]
}`;

// Aus Text wird eine Figur. Wirft, wenn nichts Brauchbares drinsteht.
export function parseBotJson(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    throw new Error("Das ist kein gültiges JSON — bitte die geschweiften Klammern prüfen.");
  }

  const raw = Array.isArray(data) ? data[0] : data?.character || data?.agent || data?.bot || data;
  if (!raw || typeof raw !== "object") throw new Error("Es steht keine Figur darin.");

  const name =
    pick(raw, ["name", "Name", "title", "Title", "displayName", "bot_name", "character_name"]) ||
    "Importierte Figur";

  const ageRaw = raw.adultAge ?? raw.age ?? raw.Age;
  const age = Number(ageRaw);

  const description = pick(raw, [
    "description", "persona", "personaPrompt", "system", "system_prompt", "prompt",
    "backstory", "bio", "summary", "greeting", "first_message",
  ]);

  const character = {
    name,
    adultAge: Number.isFinite(age) && age >= 18 ? age : 18,
    createdByRole: "GAST",
    fictional: true,
    sourceConsentVerified: false,
    art: pick(raw, ["art", "kind", "species", "race", "type", "entity"]),
    appearance: pick(raw, ["appearance", "looks", "look", "physical", "body", "portrait"]),
    behavior: pick(raw, ["behavior", "behaviour", "demeanor", "manner", "style", "personality", "traits"]),
    understanding: pick(raw, ["understanding", "intelligence", "awareness", "cognition"]),
    description,
    neigungen: normalizeNeigungen(raw.neigungen || raw.kinks || raw.tags || raw.interests),
    voiceId: "",
    moduleIds: [],
    avatar: pick(raw, ["avatar", "image", "picture"]),
    images: [],
  };

  const notes = [];
  if (!pick(raw, ["appearance", "looks", "look", "physical", "body"])) notes.push("Aussehen war nicht dabei.");
  if (!pick(raw, ["behavior", "behaviour", "demeanor", "manner", "style", "personality", "traits"])) notes.push("Benehmen war nicht dabei.");
  if (!pick(raw, ["understanding", "intelligence", "awareness", "cognition"])) notes.push("Verständnis war nicht dabei.");
  const voiceHint = pick(raw, ["voice", "voiceId", "voice_name", "tts_voice"]);
  if (voiceHint) notes.push(`Stimme „${voiceHint}" aus der Vorlage — bitte unten aus deiner Stimmbank wählen.`);
  if (Number.isFinite(age) && age < 18) notes.push("Alter war unter 18 — auf 18 gesetzt.");

  return {
    character,
    module: {
      title: name,
      kind: "IMPORT",
      text: description,
      short: character.behavior,
      source: "IMPORT",
      payload: raw,
    },
    notes,
  };
}