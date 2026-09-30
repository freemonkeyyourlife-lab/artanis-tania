import { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";

// Aufnehmen und gleich privat ablegen — beide Wege zur eigenen Stimme
// (Emotionsproben und die schnelle Aufnahme am Charakter) nutzen dasselbe.
export default function useVoiceRecorder(onReady) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  const toggle = async (fileName = "stimme.webm") => {
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
          const file = new File([blob], fileName, { type: "audio/webm" });
          const up = await base44.integrations.Core.UploadPrivateFile({ file });
          await onReady(up.file_uri);
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

  return { recording, busy, toggle };
}