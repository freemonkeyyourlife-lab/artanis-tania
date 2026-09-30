import { useCallback, useEffect, useRef, useState } from "react";
import { resolveVoice, cloudTuning } from "@/lib/voiceDj";
import { speakAsVoice } from "@/lib/voiceChat";

// Tonlage und Tempo je Grundstimme — damit sich die Charaktere beim Vorlesen unterscheiden.
export const VOICE_TUNING = {
  river: { pitch: 1, rate: 1 },
  honey: { pitch: 0.9, rate: 0.95 },
  sunny: { pitch: 1.2, rate: 1.08 },
  storm: { pitch: 0.7, rate: 0.92 },
  spark: { pitch: 1.3, rate: 1.2 },
};

// Spricht Text mit der Stimme aus der Stimmbank — genau so, wie sie eingestellt
// ist. Die Roboterstimme des Browsers kommt hier nie zum Einsatz.
export default function useVoicePlayer(profile, fallbackVoice) {
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef(null);

  const halt = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setSpeaking(false);
  }, []);

  const speak = useCallback(
    async (text) => {
      if (!text) return;
      halt();
      setLoading(true);
      try {
        // Ohne zugeordnete Stimme spricht wenigstens die Grundstimme des Charakters.
        const target = profile || (fallbackVoice ? { baseVoice: fallbackVoice } : null);
        const url = await speakAsVoice(target, text);
        if (!url) throw new Error("Keine Stimme erhalten");
        const rate = profile?.provider === "ELEVENLABS"
          ? cloudTuning(profile).pitch
          : profile
            ? resolveVoice(profile).audioRate
            : VOICE_TUNING[fallbackVoice]?.rate ?? 1;
        const audio = new Audio(url);
        audio.preservesPitch = false;
        audio.webkitPreservesPitch = false;
        audio.playbackRate = Math.max(0.5, Math.min(2, rate));
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
    },
    [profile, fallbackVoice, halt]
  );

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  return { speak, halt, speaking, loading, canSpeak: true };
}