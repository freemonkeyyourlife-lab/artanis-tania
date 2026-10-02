// Welches OpenRouter-Modell die Stimmung liest. Bleibt im Browser hängen —
// ist nichts gewählt, liest die Standard-KI.

const MOOD_KEY = "artanis.moodModel";

export const getMoodModel = () => {
  try {
    return localStorage.getItem(MOOD_KEY) || "";
  } catch (e) {
    return "";
  }
};

export const setMoodModel = (modelId) => {
  try {
    if (modelId) localStorage.setItem(MOOD_KEY, modelId);
    else localStorage.removeItem(MOOD_KEY);
  } catch (e) {
    // kein Speicher verfügbar — dann eben nur für diese Sitzung
  }
};