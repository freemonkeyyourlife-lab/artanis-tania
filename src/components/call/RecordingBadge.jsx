import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Circle, Download, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { setRecordingState } from "@/lib/liveRoom";
import { readPreferredCamera } from "@/lib/videoSource";

// Aufnahme im Call: sichtbar für alle im Raum. Läuft sie, steht es oben —
// bei jedem. Starten darf sie der Besitzer; aufgenommen wird Bild und Ton.
export default function RecordingBadge({ token, myName, isOwner }) {
  const [room, setRoom] = useState(null);
  const [busy, setBusy] = useState(false);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const streamRef = useRef(null);

  useEffect(() => {
    let alive = true;
    base44.entities.LiveRoom.filter({ token })
      .then((rooms) => { if (alive) setRoom(rooms?.[0] || null); })
      .catch(() => {});
    const unsubscribe = base44.entities.LiveRoom.subscribe((event) => {
      if (event.data?.token !== token) return;
      setRoom(event.type === "delete" ? null : event.data);
    });
    return () => {
      alive = false;
      unsubscribe();
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [token]);

  const recording = !!room?.recording;

  const start = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const deviceId = readPreferredCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: deviceId ? { deviceId: { exact: deviceId } } : true,
        audio: true,
      });
      streamRef.current = stream;
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => { if (e.data?.size) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
        chunksRef.current = [];
        try {
          const file = new File([blob], `aufnahme-${Date.now()}.webm`, { type: blob.type });
          const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
          const found = await base44.entities.LiveRoom.filter({ token });
          if (found?.[0]) {
            const updated = await base44.entities.LiveRoom.update(found[0].id, { recordingUrl: file_uri });
            setRoom(updated);
          }
        } catch (e) {
          console.error("Aufnahme konnte nicht abgelegt werden", e);
        }
      };
      recorder.start();
      recorderRef.current = recorder;
      const updated = await setRecordingState(token, myName, true);
      setRoom(updated);
    } catch (e) {
      console.error("Aufnahme startet nicht", e);
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    } finally {
      setBusy(false);
    }
  };

  const stop = async () => {
    if (busy) return;
    setBusy(true);
    try {
      recorderRef.current?.stop();
      recorderRef.current = null;
      const updated = await setRecordingState(token, myName, false);
      setRoom(updated);
    } finally {
      setBusy(false);
    }
  };

  const openLast = async () => {
    const res = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: room.recordingUrl, expires_in: 600 });
    if (res?.signed_url) window.open(res.signed_url, "_blank");
  };

  if (recording) {
    return (
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-destructive/25 text-destructive text-[11px] font-bold uppercase tracking-wider whitespace-nowrap">
          <Circle className="w-3 h-3 fill-current animate-pulse" />
          Aufnahme läuft{room.recordingBy ? ` · ${room.recordingBy}` : ""}
        </span>
        {isOwner && (
          <button
            onClick={stop}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-elevated text-muted-foreground text-[11px] font-semibold hover:text-foreground transition-colors disabled:opacity-60"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Beenden
          </button>
        )}
      </div>
    );
  }

  if (!isOwner) return null;

  return (
    <div className="flex items-center gap-2 flex-shrink-0">
      <button
        onClick={start}
        disabled={busy}
        title="Bild und Ton dieses Calls aufnehmen — alle im Raum sehen, dass es läuft"
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-elevated text-[11px] font-semibold uppercase tracking-wider transition-colors disabled:opacity-60",
          "text-muted-foreground hover:text-foreground"
        )}
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Circle className="w-3.5 h-3.5" />}
        Aufnahme
      </button>
      {room?.recordingUrl && (
        <button
          onClick={openLast}
          title="Die letzte Aufnahme anhören"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-elevated text-muted-foreground text-[11px] font-semibold hover:text-foreground transition-colors"
        >
          <Download className="w-3.5 h-3.5" /> Letzte
        </button>
      )}
    </div>
  );
}