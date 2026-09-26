import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Mic, Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Speak instead of typing: records, transcribes and hands the text back.
export default function VoiceInput({ onResult, className, disabled, title = "Sprechen statt tippen" }) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  const toggle = async () => {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        setBusy(true);
        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const file = new File([blob], "voice.webm", { type: "audio/webm" });
          const up = await base44.integrations.Core.UploadPublicFile({ file });
          const res = await base44.integrations.Core.TranscribeAudio({ audio_url: up.file_url });
          const text = typeof res === "string" ? res : (res.transcript || res.text || res.output || "");
          if (text && text.trim()) onResult(text.trim());
        } catch (e) {
          console.error(e);
        } finally {
          setBusy(false);
        }
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={disabled || busy}
      title={title}
      className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-50",
        recording ? "bg-red-500 text-white animate-pulse" : "bg-elevated text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : recording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
    </button>
  );
}