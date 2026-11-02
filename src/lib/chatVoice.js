import { base44 } from "@/api/base44Client";
import { speak, stopSpeaking } from "@/lib/chatSpeak";
import { cloudTuning, fineTuning, playVolume, resolveVoice } from "@/lib/voiceDj";

// Sprechen im Chat-Modul: mit einer Stimme aus der Stimmbank der App — oder,
// wenn keine gewählt ist, mit der Stimme des Geräts.

let audio = null;
const cache = new Map();

export function stopAll() {
  if (audio) {
    audio.pause();
    audio = null;
  }
  stopSpeaking();
}

// Die gewählte Stimme einmal holen und dann behalten — sonst würde bei jeder
// Zeile neu geladen.
async function loadVoice(id) {
  if (!id) return null;
  if (cache.has(id)) return cache.get(id);
  const voice = await base44.entities.Voice.get(id).catch(() => null);
  if (voice) cache.set(id, voice);
  return voice;
}

// Die Stimme sprechen lassen und den Ton ablegen — mit denselben Werten, die
// auch im Studio gelten, damit sie hier genauso klingt. Die Stimmung der Figur
// überschreibt Tempo, Klang und Intensität, wenn sie mitgegeben wird.
async function speakWithVoice(voice, text, mood) {
  const tune = cloudTuning(voice);
  const voiceMood = mood?.mood || voice.mood;
  const intensity = typeof mood?.intensity === "number" ? mood.intensity : tune.intensity;

  if (voice.provider === "ELEVENLABS" && voice.externalVoiceId) {
    const res = await base44.functions.invoke("elevenLabs", {
      voiceId: voice.externalVoiceId,
      text,
      speed: tune.apiSpeed,
      mood: voiceMood,
      intensity,
      ending: voice.ending,
      modelId: voice.modelId,
      tuning: fineTuning(voice),
    });
    if (res.data?.error) throw new Error(res.data.error);
    if (!res.data?.url) throw new Error("Die Stimme kam nicht zurück.");
    const rate = typeof mood?.speed === "number" && mood.speed ? mood.speed : tune.pitch;
    return { url: res.data.url, rate, volume: playVolume(voice) };
  }

  // Eine Grundstimme spricht die Plattform selbst.
  const res = await base44.integrations.Core.GenerateSpeech({
    text,
    voice: resolveVoice(voice).baseVoice,
  });
  if (!res?.url) throw new Error("Die Stimme kam nicht zurück.");
  const rate = typeof mood?.speed === "number" && mood.speed ? mood.speed : resolveVoice(voice).audioRate;
  return { url: res.url, rate, volume: playVolume(voice) };
}

export async function speakText(text, { voiceId, voiceName, mood, onEnd } = {}) {
  stopAll();
  const clean = String(text || "").trim();
  if (!clean) return null;

  const voice = await loadVoice(voiceId);
  if (voice) {
    const tone = await speakWithVoice(voice, clean, mood);
    audio = new Audio(tone.url);
    audio.preservesPitch = false;
    audio.webkitPreservesPitch = false;
    audio.playbackRate = tone.rate;
    audio.volume = tone.volume;
    audio.onended = () => {
      audio = null;
      onEnd?.();
    };
    audio.onerror = () => {
      audio = null;
      onEnd?.();
    };
    await audio.play();
    return "pool";
  }

  if (speak(clean, voiceName, onEnd, mood?.speed)) return "device";
  return null;
}

// Eine Reihe von Zeilen sprechen — nacheinander, jede mit ihrer eigenen Stimme.
// So klingt jede Figur wie sie selbst, statt dass alle gleich klingen.
export async function speakSequence(blocks, { voiceName, voiceId } = {}) {
  stopAll();
  for (const block of blocks || []) {
    await new Promise((resolve) => {
      speakText(block.text, {
        voiceId: block.voiceId || voiceId,
        voiceName: block.voiceName || voiceName,
        onEnd: resolve,
      })
        .then((how) => {
          if (!how) resolve();
        })
        .catch(() => resolve());
    });
  }
}