import React, { useCallback, useEffect, useRef, useState } from "react";
import { Volume2, Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveVoice } from "@/lib/voiceDj";
import { base44 } from "@/api/base44Client";

// Tonlage und Tempo je Charakter-Stimme — damit sich die Charaktere beim Vorlesen unterscheiden.
const VOICE_TUNING = {
  river: { pitch: 1, rate: 1 },
  honey: { pitch: 0.9, rate: 0.95 },
  sunny: { pitch: 1.2, rate: 1.08 },
  storm: { pitch: 0.7, rate: 0.92 },
  spark: { pitch: 1.3, rate: 1.2 },
};

export default function ReadAloudButton({ text, voice, profile, className, autoPlay = false }) {
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef(null);
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;
  // Ist dem Charakter eine Stimme aus ElevenLabs zugeordnet, sprechen wir darüber.
  const cloudVoice = profile?.provider === "ELEVENLABS" ? profile.externalVoiceId : "";

  // Über ElevenLabs: die Stimme kommt als fertiger Ton zurück.
  const speakCloud = useCallback(async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("elevenLabs", { voiceId: cloudVoice, text });
      if (res.data?.error) throw new Error(res.data.error);
      const audio = new Audio(res.data.url);
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
  }, [cloudVoice, text]);

  const speak = useCallback(() => {
    if (!text) return;
    if (cloudVoice) { speakCloud(); return; }
    if (!supported) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    // Ist dem Charakter eine Stimme aus der Stimmbank zugeordnet, gilt die — sonst die Grundstimmung.
    const tune = profile ? resolveVoice(profile) : (VOICE_TUNING[voice] || VOICE_TUNING.river);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "de-DE";
    utterance.pitch = tune.pitch;
    utterance.rate = tune.rate;
    const german = synth.getVoices().find((v) => (v.lang || "").toLowerCase().startsWith("de"));
    if (german) utterance.voice = german;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    synth.speak(utterance);
  }, [text, voice, profile, supported, cloudVoice, speakCloud]);

  const halt = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  // Freisprechen: jede neue Zeile wird von selbst vorgelesen.
  useEffect(() => {
    if (!autoPlay || !text) return;
    speak();
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (supported) window.speechSynthesis.cancel();
    };
  }, [autoPlay, text, speak, supported]);

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
      if (supported) window.speechSynthesis.cancel();
    };
  }, [supported]);

  if (!text || (!supported && !cloudVoice)) return null;

  const toggle = () => {
    if (speaking) { halt(); return; }
    speak();
  };

  return (
    <button
      onClick={toggle}
      disabled={loading}
      title={speaking ? "Vorlesen stoppen" : "Vorlesen"}
      className={cn("inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50", className)}
    >
      {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : speaking ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
      {loading ? "Lädt …" : speaking ? "Stopp" : "Vorlesen"}
    </button>
  );
}