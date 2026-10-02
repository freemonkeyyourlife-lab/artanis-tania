// Die Modelle, mit denen eine Stimme spricht — und die Sprachen, in denen sie
// das kann. Mehrsprachige Modelle übernehmen die Sprache des Textes: eine
// englische Stimme redet damit auch Deutsch.

export const VOICE_MODELS = [
  {
    id: "eleven_multilingual_v2",
    name: "Multilingual v2",
    hint: "beste Qualität · jede Sprache",
    multilingual: true,
  },
  {
    id: "eleven_turbo_v2_5",
    name: "Turbo v2.5",
    hint: "schnell & günstig · jede Sprache",
    multilingual: true,
  },
  {
    id: "eleven_flash_v2_5",
    name: "Flash v2.5",
    hint: "am schnellsten · jede Sprache",
    multilingual: true,
  },
  {
    id: "eleven_multilingual_v1",
    name: "Multilingual v1",
    hint: "ältere Mehrsprachen-Fassung",
    multilingual: true,
  },
  {
    id: "eleven_monolingual_v1",
    name: "Monolingual v1",
    hint: "nur Englisch",
    multilingual: false,
  },
];

// Das Modell, das jede Sprache spricht — darauf wird umgestellt, wenn du eine
// Sprache wählst und das eingestellte Modell nur Englisch kann.
export const MULTILINGUAL_DEFAULT = "eleven_multilingual_v2";

export const VOICE_LANGUAGES = [
  { id: "DEUTSCH", label: "Deutsch" },
  { id: "ENGLISCH", label: "Englisch" },
  { id: "SPANISCH", label: "Spanisch" },
  { id: "FRANZOESISCH", label: "Französisch" },
  { id: "ITALIENISCH", label: "Italienisch" },
  { id: "PORTUGIESISCH", label: "Portugiesisch" },
  { id: "NIEDERLAENDISCH", label: "Niederländisch" },
  { id: "POLNISCH", label: "Polnisch" },
  { id: "TURKISCH", label: "Türkisch" },
  { id: "RUSSISCH", label: "Russisch" },
  { id: "ARABISCH", label: "Arabisch" },
  { id: "HINDI", label: "Hindi" },
  { id: "JAPANISCH", label: "Japanisch" },
  { id: "KOREANISCH", label: "Koreanisch" },
  { id: "CHINESISCH", label: "Chinesisch" },
];

// Die Bibliothek aus der Datenbank vor die eingebaute Liste setzen — so stehen
// selbst hochgeladene Modelle ganz oben und nichts geht verloren.
export function mergeVoiceModels(rows = []) {
  const lib = (rows || [])
    .filter((m) => m.enabled !== false)
    .map((m) => ({
      id: m.modelId,
      name: m.name,
      hint: m.description || m.note || (m.provider === "EXTERN" ? "eigenes Modell" : ""),
      multilingual: m.multilingual !== false,
      url: m.url || "",
    }));
  const seen = new Set(lib.map((m) => m.id));
  return [...lib, ...VOICE_MODELS.filter((m) => !seen.has(m.id))];
}

export const findVoiceModel = (models = [], modelId) =>
  models.find((m) => m.id === modelId) || null;

export const voiceModelLabel = (models = [], modelId) => {
  if (!modelId) return "Standard";
  const found = models.find((m) => m.id === modelId) || VOICE_MODELS.find((m) => m.id === modelId);
  return found?.name || modelId;
};

export const modelIsMultilingual = (models = [], modelId) => {
  if (!modelId) return true; // ohne Wahl spricht ElevenLabs mehrsprachig
  const found = models.find((m) => m.id === modelId) || VOICE_MODELS.find((m) => m.id === modelId);
  return found ? found.multilingual !== false : true;
};

export const languageLabel = (id) =>
  VOICE_LANGUAGES.find((l) => l.id === id)?.label || id || "";