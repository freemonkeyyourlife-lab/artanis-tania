// Sprache und Versand an einem Ort: ElevenLabs spricht den Text, Telegram
// bekommt daraus eine echte Sprachnachricht. Von hier holen sich die
// Backend-Funktionen sowohl das Sprechen als auch das Verschicken.

const ELEVEN = "https://api.elevenlabs.io/v1";
const TG = "https://api.telegram.org";

// Stimmung → Regler für ElevenLabs. Weniger Stabilität und mehr Stil = intensiver,
// mehr Stabilität = ruhiger und kontrollierter.
const MOOD_SETTINGS: Record<string, any> = {
  NEUTRAL: { stability: 0.5, similarity_boost: 0.75, style: 0 },
  SANFT: { stability: 0.68, similarity_boost: 0.75, style: 0.05 },
  VERFUEHRERISCH: { stability: 0.35, similarity_boost: 0.85, style: 0.35 },
  HEISS: { stability: 0.28, similarity_boost: 0.9, style: 0.5 },
  SPIELERISCH: { stability: 0.4, similarity_boost: 0.75, style: 0.3 },
  ERNST: { stability: 0.72, similarity_boost: 0.85, style: 0.08 },
  HART: { stability: 0.55, similarity_boost: 0.9, style: 0.22 },
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

// Intensität 0–100: höher = weniger Stabilität, mehr Ausdruck.
export function voiceSettings(mood: string, intensity: any) {
  const preset = MOOD_SETTINGS[mood] || MOOD_SETTINGS.NEUTRAL;
  const level = Number(intensity);
  if (!Number.isFinite(level)) return preset;
  return {
    ...preset,
    stability: clamp(0.8 - (level / 100) * 0.6, 0, 1),
    style: clamp((level / 100) * 0.7, 0, 1),
  };
}

// Den Text sprechen und die fertigen Tondaten zurückgeben.
export async function synthesize(input: {
  key: string;
  voiceId: string;
  text: string;
  mood?: string;
  intensity?: any;
  speed?: any;
  format?: string;
  modelId?: string;
}): Promise<Uint8Array> {
  const format = input.format || "mp3_44100_128";
  const settings = voiceSettings(String(input.mood || ""), input.intensity);
  const wanted = Number(input.speed);

  const res = await fetch(`${ELEVEN}/text-to-speech/${input.voiceId}?output_format=${format}`, {
    method: "POST",
    headers: {
      "xi-api-key": input.key,
      "Content-Type": "application/json",
      Accept: format.startsWith("opus") ? "audio/ogg" : "audio/mpeg",
    },
    body: JSON.stringify({
      text: String(input.text || "").slice(0, 2500),
      model_id: input.modelId || "eleven_multilingual_v2",
      voice_settings: {
        stability: settings.stability,
        similarity_boost: settings.similarity_boost,
        style: settings.style,
        use_speaker_boost: true,
        speed: Number.isFinite(wanted) ? clamp(wanted, 0.7, 1.2) : 1,
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    let message = `ElevenLabs (${res.status})`;
    try {
      message = JSON.parse(detail)?.detail?.message || message;
    } catch (parseError) {
      // keine JSON-Antwort — dann bleibt der Statuscode
    }
    throw new Error(message);
  }

  return new Uint8Array(await res.arrayBuffer());
}

// Als Sprachnachricht mit Wellenform — dafür braucht Telegram OGG/Opus.
export async function sendVoice(input: { token: string; chatId: string; bytes: Uint8Array }) {
  const form = new FormData();
  form.append("chat_id", String(input.chatId));
  form.append("voice", new Blob([input.bytes], { type: "audio/ogg" }), "stimme.ogg");
  const res = await fetch(`${TG}/bot${input.token}/sendVoice`, { method: "POST", body: form });
  return res.json();
}

// Ersatzweg: dieselbe Stimme als Audiodatei, falls Telegram die Wellenform ablehnt.
export async function sendAudio(input: { token: string; chatId: string; bytes: Uint8Array; title?: string }) {
  const form = new FormData();
  form.append("chat_id", String(input.chatId));
  if (input.title) form.append("title", String(input.title).slice(0, 60));
  form.append("audio", new Blob([input.bytes], { type: "audio/mpeg" }), "stimme.mp3");
  const res = await fetch(`${TG}/bot${input.token}/sendAudio`, { method: "POST", body: form });
  return res.json();
}