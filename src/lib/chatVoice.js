import { base44 } from "@/api/base44Client";
import { speak, stopSpeaking } from "@/lib/chatSpeak";

// Sprechen im Chat-Modul: entweder mit einer Stimme aus dem Pool der App
// (ElevenLabs) oder, wenn keine gewählt ist, mit der Stimme des Geräts.

let audio = null;

export function stopAll() {
  if (audio) {
    audio.pause();
    audio = null;
  }
  stopSpeaking();
}

export async function speakText(text, { voiceModelId, voiceName, onEnd } = {}) {
  stopAll();
  const clean = String(text || "").trim();
  if (!clean) return null;

  // Eine Stimme aus dem Pool klingt wie im Studio — sie läuft über den Dienst.
  if (voiceModelId) {
    const res = await base44.functions.invoke("elevenLabs", {
      voiceId: voiceModelId,
      text: clean,
      fast: true,
    });
    const url = res.data?.url;
    if (!url) throw new Error(res.data?.error || "Die Stimme kam nicht zurück.");
    audio = new Audio(url);
    audio.onended = () => {
      audio = null;
      onEnd?.();
    };
    await audio.play();
    return "pool";
  }

  if (speak(clean, voiceName)) return "device";
  return null;
}