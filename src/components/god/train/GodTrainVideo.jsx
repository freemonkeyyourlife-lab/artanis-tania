import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Loader2, Film, Camera, Plus, Link2, User, Clapperboard } from "lucide-react";

// Aus einem Video oder Stream einzelne Frames ziehen, dauerhaft ablegen und
// daraus ein Trainingsset für eine Person bauen. Lokale Dateien gehen immer;
// Remote-URLs brauchen CORS-Freigabe, sonst ist die Leinwand gesperrt.

const MAX = 768; // längste Seite der Screenshots — klein genug zum Speichern.

function scale(w, h) {
  const r = Math.min(1, MAX / Math.max(w, h));
  return { w: Math.round(w * r), h: Math.round(h * r) };
}

export default function GodTrainVideo({ onChanged }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  const [src, setSrc] = useState("");
  const [personName, setPersonName] = useState("");
  const [count, setCount] = useState(12);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [frames, setFrames] = useState([]);
  const [err, setErr] = useState("");
  const [made, setMade] = useState(false);

  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (f) setSrc(URL.createObjectURL(f));
    setFrames([]);
    setMade(false);
  };

  const onUrl = (e) => {
    setSrc(e.target.value.trim());
    setFrames([]);
    setMade(false);
  };

  const capture = async () => {
    const video = videoRef.current;
    if (!video || !src || busy) return;
    setErr("");
    setBusy(true);
    setFrames([]);
    setMade(false);
    try {
      video.crossOrigin = "anonymous";
      await video.play().catch(() => {});
      video.pause();
      const dur = video.duration;
      if (!isFinite(dur) || dur <= 0) throw new Error("Die Videodauer ist nicht abrufbar — für Streams nötig CORS/seekbar.");
      const canvas = canvasRef.current;
      const n = Math.max(1, Math.min(40, count || 12));
      const collected = [];
      for (let i = 0; i < n; i += 1) {
        const t = (dur * (i + 0.5)) / n;
        await new Promise((resolve) => {
          const onSeek = () => { video.removeEventListener("seeked", onSeek); resolve(); };
          video.addEventListener("seeked", onSeek);
          video.currentTime = Math.min(t, dur - 0.05);
          setTimeout(resolve, 4000); // Schutz: nie hängen bleiben.
        });
        const { w, h } = scale(video.videoWidth, video.videoHeight);
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext("2d");
        try {
          ctx.drawImage(video, 0, 0, w, h);
        } catch {
          setErr("Frame gesperrt — das Video erlaubt kein CORS-lesen.");
          break;
        }
        const blob = await new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.9));
        if (!blob) continue;
        const file = new File([blob], `frame_${String(i + 1).padStart(2, "0")}.jpg`, { type: "image/jpeg" });
        try {
          const up = await base44.integrations.Core.UploadPublicFile({ file });
          if (up?.file_url) collected.push(up.file_url);
        } catch {
          setErr("Speichern eines Frames schlug fehl — weiter mit dem nächsten.");
        }
        setProgress(`${i + 1}/${n} Frames …`);
        setFrames([...collected]);
      }
      setProgress("");
      if (!collected.length) setErr("Keine Frames einfangbar — anderes Video oder CORS prüfen.");
    } catch (e) {
      setErr(e?.message || "Aufzeichnung fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  };

  const createSet = async () => {
    if (!frames.length || !personName.trim() || busy) return;
    setBusy(true);
    try {
      await base44.entities.TrainingSet.create({
        personName: personName.trim(),
        images: frames,
        status: frames.length >= 12 ? "BEREIT" : "SAMMLUNG",
        targetCount: 12,
      });
      setMade(true);
      onChanged?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-primary">
        <Clapperboard className="w-4 h-4" />
        <p className="text-[13px] font-bold uppercase tracking-wider">Video → Trainingsset</p>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="glass-btn inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-bold"
        >
          <Film className="w-4 h-4" /> Video-Datei
        </button>
        <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={onFile} />
        <input
          value={src.startsWith("blob:") ? "" : src}
          onChange={onUrl}
          placeholder="oder Video-/Stream-URL"
          className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
        />
      </div>

      {src && (
        <div className="rounded-xl overflow-hidden bg-black border border-border">
          <video ref={videoRef} src={src} crossOrigin="anonymous" className="w-full max-h-44 object-contain" preload="metadata" muted playsInline />
        </div>
      )}

      <div className="flex flex-wrap gap-2 items-center">
        <input
          value={personName}
          onChange={(e) => setPersonName(e.target.value)}
          placeholder="Person/Charakter-Name"
          className="flex-1 min-w-[120px] px-3 py-2 rounded-xl bg-background border border-border text-[12px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
        />
        <input
          type="number"
          min={1}
          max={40}
          value={count}
          onChange={(e) => setCount(Number(e.target.value) || 12)}
          className="w-20 px-3 py-2 rounded-xl bg-background border border-border text-[12px] text-foreground"
        />
        <button
          onClick={capture}
          disabled={busy || !src}
          className="glass-btn inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-bold disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />} Frames sammeln
        </button>
      </div>

      {progress && <p className="text-[11px] text-primary font-bold">{progress}</p>}
      {err && <p className="text-[11px] text-destructive font-bold">{err}</p>}

      {frames.length > 0 && (
        <>
          <div className="grid grid-cols-4 gap-1.5">
            {frames.map((u, i) => (
              <div key={i} className="h-16 w-full overflow-hidden rounded-lg bg-background">
                <Image src={u} fittingType="fill" className="h-full w-full" />
              </div>
            ))}
          </div>
          <button
            onClick={createSet}
            disabled={busy || !personName.trim()}
            className="glass-btn glass-btn-accent inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[12px] font-bold text-gloss disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Trainingsset anlegen ({frames.length})
          </button>
          {made && <p className="text-[11px] text-primary font-bold flex items-center gap-1"><User className="w-3 h-3" /> Set angelegt — unter Trainingssets sichtbar.</p>}
        </>
      )}

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}