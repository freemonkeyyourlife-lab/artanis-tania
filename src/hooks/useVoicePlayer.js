import { useCallback, useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { resolveVoice, cloudTuning } from "@/lib/voiceDj";

// Tonlage und Tempo je Grundstimme — damit sich die Charaktere beim Vorlesen unterscheiden.
export const VOICE_TUNING = {
  river: { pitch: 1, rate: 1 },
  honey: { pitch: 0.9, rate: 0.95 },
  sunny: { pitch: 1.2, rate: 1.08 },
  storm: { pitch: 0.7, rate: 0.92 },
  spark: { pitch: 1.3, rate: 1.2 },
};

// Spricht Text mit einer Stimme aus der Stimmbank.
// Ist die Stimme bei ElevenLabs hinterlegt, kommt der Ton von dort — sonst spricht der Browser.
export default function useVoicePlayer(profile, fallbackVoice) {
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef(null);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  const cloudVoice = profile?.provider === "ELEVENLABS" ? profile.externalVoiceId : "";

  const halt = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }, [supported]);

  const speak = useCallback(
    async (text) => {
      if (!text) return;
      halt();

      if (cloudVoice) {
        setLoading(true);
        try {
          const tune = cloudTuning(profile);
          const res = await base44.functions.invoke("elevenLabs", {
            voiceId: cloudVoice,
            text,
            speed: tune.apiSpeed,
            mood: profile?.mood,
            intensity: tune.intensity,
            ending: profile?.ending,
          });
          if (res.data?.error) throw new Error(res.data.error);
          const audio = new Audio(res.data.url);
          audio.preservesPitch = false;
          audio.webkitPreservesPitch = false;
          audio.playbackRate = tune.pitch;
          audio.onended = () => setSpeaking(false);
          audio.onerror = () => setSpeaking(false);
          audioRef.current = audio;
          setSpeaking(true);
          await audio.play();
        } catch (e) {
          console.error(e);
          setSpeaking(false);
        } finally {
          setLoading(false);
        }
        return;
      }

      if (!supported) return;
      const tune = profile ? resolveVoice(profile) : VOICE_TUNING[fallbackVoice] || VOICE_TUNING.river;
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "de-DE";
      utterance.pitch = tune.pitch;
      utterance.rate = tune.rate;
      const german = window.speechSynthesis.getVoices().find((v) => (v.lang || "").toLowerCase().startsWith("de"));
      if (german) utterance.voice = german;
      utterance.onend = () => setSpeaking(false);
      utterance.onerror = () => setSpeaking(false);
      setSpeaking(true);
      window.speechSynthesis.speak(utterance);
    },
    [cloudVoice, profile, fallbackVoice, supported, halt]
  );

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (supported) window.speechSynthesis.cancel();
    };
  }, [supported]);

  return { speak, halt, speaking, loading, canSpeak: Boolean(cloudVoice) || supported };
}