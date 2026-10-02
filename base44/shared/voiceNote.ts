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
// Ausklang 0–100: höher = am Satzende ruhiger und weicher statt abgehackt.
export function voiceSettings(mood: string, intensity: any, ending: any, tuning?: any) {
  const preset = MOOD_SETTINGS[mood] || MOOD_SETTINGS.NEUTRAL;
  const level = Number(intensity);
  const base = Number.isFinite(level)
    ? {
        ...preset,
        stability: clamp(0.8 - (level / 100) * 0.6, 0, 1),
        style: clamp((level / 100) * 0.7, 0, 1),
      }
    : preset;

  const end = Number(ending);
  const soft = clamp(Number.isFinite(end) ? end : 50, 0, 100) / 100;

  // Von Hand eingestellter Feinschliff schlägt die Stimmung. −1 heißt: nicht gesetzt.
  const pick = (value: any) => {
    const n = Number(value);
    return Number.isFinite(n) && n >= 0 ? clamp(n, 0, 100) / 100 : null;
  };
  const stability = pick(tuning?.stability);
  const style = pick(tuning?.style);
  const similarity = pick(tuning?.similarity);

  return {
    stability: stability ?? clamp(base.stability + soft * 0.2, 0, 1),
    style: style ?? clamp(base.style - soft * 0.3, 0, 1),
    similarity_boost: similarity ?? base.similarity_boost,
    use_speaker_boost: tuning?.presence !== false,
  };
}

// Am Satzende einen kurzen Atemzug anhängen — sonst hört die Stimme einfach auf.
export function withEnding(text: any, ending: any) {
  const clean = String(text || "").trim();
  if (!clean) return clean;
  const end = Number(ending);
  const level = Number.isFinite(end) ? clamp(end, 0, 100) : 50;
  if (level < 15) return clean;
  return /[.!?…]$/.test(clean) ? `${clean} …` : `${clean}. …`;
}

// Den Text sprechen und die fertigen Tondaten zurückgeben.
export async function synthesize(input: {
  key: string;
  voiceId: string;
  text: string;
  mood?: string;
  intensity?: any;
  ending?: any;
  speed?: any;
  format?: string;
  modelId?: string;
  tuning?: any;
}): Promise<Uint8Array> {
  const format = input.format || "mp3_44100_128";
  const settings = voiceSettings(String(input.mood || ""), input.intensity, input.ending, input.tuning);
  const wanted = Number(input.speed);

  const res = await fetch(`${ELEVEN}/text-to-speech/${input.voiceId}?output_format=${format}`, {
    method: "POST",
    headers: {
      "xi-api-key": input.key,
      "Content-Type": "application/json",
      Accept: format.startsWith("opus") ? "audio/ogg" : "audio/mpeg",
    },
    body: JSON.stringify({
      text: withEnding(input.text, input.ending).slice(0, 2500),
      model_id: input.modelId || "eleven_multilingual_v2",
      voice_settings: {
        stability: settings.stability,
        similarity_boost: settings.similarity_boost,
        style: settings.style,
        use_speaker_boost: settings.use_speaker_boost !== false,
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