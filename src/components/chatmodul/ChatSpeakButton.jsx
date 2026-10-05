import React, { useEffect, useRef, useState } from "react";
import { Volume2, Square, Loader2 } from "lucide-react";
import { speakText, stopAll } from "@/lib/chatVoice";

// Liest eine Nachricht vor — nochmal drücken hält sie an. Mit einer Stimme aus
// dem Pool klingt sie wie im Studio, sonst spricht das Gerät.
export default function ChatSpeakButton({ text, voiceName, voiceModelId, accent }) {
  const [state, setState] = useState("idle");
  const timer = useRef(null);

  const watch = () => {
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      if (!window.speechSynthesis?.speaking) {
        clearInterval(timer.current);
        setState("idle");
      }
    }, 400);
  };

  useEffect(
    () => () => {
      clearInterval(timer.current);
    },
    []
  );

  const toggle = async () => {
    if (state !== "idle") {
      stopAll();
      clearInterval(timer.current);
      setState("idle");
      return;
    }
    setState("loading");
    try {
      const how = await speakText(text, {
        voiceModelId,
        voiceName,
        onEnd: () => setState("idle"),
      });
      if (!how) {
        setState("idle");
        return;
      }
      setState("speaking");
      if (how === "device") watch();
    } catch (e) {
      setState("idle");
    }
  };

  return (
    <button
      onClick={toggle}
      title={state === "idle" ? "Vorlesen" : "Anhalten"}
      className="mt-1 shrink-0 text-muted-foreground transition-colors hover:text-foreground"
      style={state !== "idle" ? { color: accent } : undefined}
    >
      {state === "loading" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : state === "speaking" ? (
        <Square className="h-4 w-4" />
      ) : (
        <Volume2 className="h-4 w-4" />
      )}
    </button>
  );
}