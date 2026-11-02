import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Film, Loader2 } from "lucide-react";

// Video hochladen → Trainingsbilder. Es werden gleichmäßig verteilte
// Einzelbilder (Frames) gezogen, als JPG gespeichert (stored privately)
// und mit dem Videonamen als Personen-Vorschlag in den Pool gelegt.
export default function VideoFrameGrabber({ onFrames, count = 6 }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState("");
  const ref = useRef(null);

  const grab = async (file) => {
    setError("");
    setBusy(true);
    setTotal(count);
    setDone(0);
    try {
      const url = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.src = url;
      video.muted = true;
      video.playsInline = true;
      await new Promise((res, rej) => {
        video.onloadedmetadata = res;
        video.onerror = () => rej(new Error("Video nicht lesbar"));
      }).catch((e) => { throw e; });
      const dur = video.duration || 0;
      if (!dur) throw new Error("Videolänge unbekannt");
      const uris = [];
      for (let i = 0; i < count; i++) {
        const t = Math.min((dur * (i + 0.5)) / count, dur - 0.05);
        await new Promise((res) => {
          const onSeeked = () => {
            video.removeEventListener("seeked", onSeeked);
            res();
          };
          video.addEventListener("seeked", onSeeked);
          video.currentTime = t;
        });
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth || 512;
        canvas.height = video.videoHeight || 512;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const blob = await new Promise((r) => canvas.toBlob(r, "image/jpeg", 0.9));
        if (blob) {
          const f = new File([blob], `frame_${i + 1}.jpg`, { type: "image/jpeg" });
          const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: f });
          uris.push(file_uri);
        }
        setDone((d) => d + 1);
      }
      URL.revokeObjectURL(url);
      const name = (file.name || "video").replace(/\.[^.]+$/, "").trim() || "Video";
      onFrames?.(uris, name);
    } catch (e) {
      setError(e?.message || "Frame-Extraktion fehlgeschlagen");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass-btn rounded-2xl border-2 border-dashed border-border px-6 py-6 text-center">
      <Film className="mx-auto h-6 w-6 text-primary" />
      <p className="mt-2 font-heading text-sm text-foreground">Video → Trainingsbilder</p>
      <p className="text-xs text-muted-foreground">
        {count} Frames werden gezogen und gespeichert (stored privately).
      </p>
      <label className="mt-3 inline-flex cursor-pointer items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Film className="h-3.5 w-3.5" />}
        {busy ? `Ziehe Frames … ${done}/${total}` : "Video wählen"}
        <input
          ref={ref}
          type="file"
          accept="video/*"
          hidden
          onChange={(e) => { const f = e.target.files?.[0]; if (f) grab(f); e.target.value = ""; }}
        />
      </label>
      {error && <p className="mt-2 text-xs text-destructive">{error}</p>}
    </div>
  );
}