import React, { useEffect, useRef, useState } from "react";
import { Volume2, Square } from "lucide-react";
import { speak, stopSpeaking } from "@/lib/chatSpeak";

// Liest eine Nachricht vor — nochmal drücken hält sie an.
export default function ChatSpeakButton({ text, voiceName, accent }) {
  const [speaking, setSpeaking] = useState(false);
  const timer = useRef(null);

  const watch = () => {
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      if (!window.speechSynthesis.speaking) {
        clearInterval(timer.current);
        setSpeaking(false);
      }
    }, 400);
  };

  useEffect(() => () => clearInterval(timer.current), []);

  const toggle = () => {
    if (speaking) {
      stopSpeaking();
      clearInterval(timer.current);
      setSpeaking(false);
      return;
    }
    if (speak(text, voiceName)) {
      setSpeaking(true);
      watch();
    }
  };

  return (
    <button
      onClick={toggle}
      title={speaking ? "Anhalten" : "Vorlesen"}
      className="mt-1 shrink-0 text-muted-foreground transition-colors hover:text-foreground"
      style={speaking ? { color: accent } : undefined}
    >
      {speaking ? <Square className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
    </button>
  );
}