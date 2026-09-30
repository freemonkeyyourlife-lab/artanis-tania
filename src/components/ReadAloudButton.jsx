import React, { useCallback, useEffect, useState } from "react";
import { Volume2, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveVoice } from "@/lib/voiceDj";

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
  const supported = typeof window !== "undefined" && "speechSynthesis" in window;

  const speak = useCallback(() => {
    if (!supported || !text) return;
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
  }, [text, voice, profile, supported]);

  // Freisprechen: jede neue Zeile wird von selbst vorgelesen.
  useEffect(() => {
    if (!autoPlay || !text) return;
    speak();
    return () => { if (supported) window.speechSynthesis.cancel(); };
  }, [autoPlay, text, speak, supported]);

  useEffect(() => {
    return () => { if (supported) window.speechSynthesis.cancel(); };
  }, [supported]);

  if (!supported || !text) return null;

  const toggle = () => {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    speak();
  };

  return (
    <button
      onClick={toggle}
      title={speaking ? "Vorlesen stoppen" : "Vorlesen"}
      className={cn("inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors", className)}
    >
      {speaking ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
      {speaking ? "Stopp" : "Vorlesen"}
    </button>
  );
}