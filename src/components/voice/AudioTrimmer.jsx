import React, { useEffect, useRef, useState } from "react";
import { Loader2, Play, Scissors, Square } from "lucide-react";
import { formatSeconds, loadAudioBuffer, peaks as buildPeaks, sliceToWav } from "@/lib/audioTrim";
import { cn } from "@/lib/utils";

// Die Aufnahme als Bild: links und rechts schieben, bis nur der brauchbare
// Teil übrig bleibt — anhören und übernehmen.
export default function AudioTrimmer({ source, onResult, onCancel }) {
  const [buffer, setBuffer] = useState(null);
  const [bars, setBars] = useState([]);
  const [start, setStart] = useState(0);
  const [end, setEnd] = useState(0);
  const [error, setError] = useState("");
  const [playing, setPlaying] = useState(false);
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const clipRef = useRef(null);

  useEffect(() => {
    let alive = true;
    setBuffer(null);
    setBars([]);
    setError("");
    loadAudioBuffer(source)
      .then((decoded) => {
        if (!alive) return;
        setBuffer(decoded);
        setBars(buildPeaks(decoded, 160));
        setStart(0);
        setEnd(decoded.duration);
      })
      .catch(() => { if (alive) setError("Diese Aufnahme ließ sich nicht öffnen."); });
    return () => {
      alive = false;
      if (audioRef.current) audioRef.current.pause();
      if (clipRef.current) URL.revokeObjectURL(clipRef.current);
    };
  }, [source]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !bars.length || !buffer) return;
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * ratio;
    canvas.height = height * ratio;
    const ctx = canvas.getContext("2d");
    ctx.scale(ratio, ratio);
    ctx.clearRect(0, 0, width, height);
    const barWidth = width / bars.length;
    bars.forEach((value, index) => {
      const time = (index / bars.length) * buffer.duration;
      const inside = time >= start && time <= end;
      ctx.fillStyle = inside ? "hsl(16 65% 68%)" : "hsl(226 11% 38%)";
      const barHeight = Math.max(2, value * (height - 6));
      ctx.fillRect(index * barWidth + 0.5, (height - barHeight) / 2, Math.max(1, barWidth - 1), barHeight);
    });
  }, [bars, buffer, start, end]);

  const stop = () => {
    if (audioRef.current) audioRef.current.pause();
    audioRef.current = null;
    setPlaying(false);
  };

  const listen = async () => {
    if (!buffer) return;
    stop();
    const blob = sliceToWav(buffer, start, end);
    if (clipRef.current) URL.revokeObjectURL(clipRef.current);
    clipRef.current = URL.createObjectURL(blob);
    const audio = new Audio(clipRef.current);
    audio.onended = () => setPlaying(false);
    audioRef.current = audio;
    await audio.play();
    setPlaying(true);
  };

  const take = () => {
    if (!buffer) return;
    const blob = sliceToWav(buffer, start, end);
    onResult(new File([blob], "ausschnitt.wav", { type: "audio/wav" }));
  };

  if (error) {
    return (
      <div className="rounded-2xl border border-border bg-background p-4">
        <p className="text-sm text-muted-foreground">{error}</p>
        <button type="button" onClick={onCancel} className="mt-2 text-xs text-primary hover:underline">Schließen</button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-primary/30 bg-background p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
          <Scissors className="w-3.5 h-3.5 text-primary" /> Aufnahme zuschneiden
        </p>
        <button type="button" onClick={onCancel} className="text-xs text-muted-foreground hover:text-foreground">Schließen</button>
      </div>

      {!buffer ? (
        <div className="flex items-center gap-2 py-6 justify-center text-muted-foreground text-sm">
          <Loader2 className="w-4 h-4 animate-spin" /> Aufnahme wird gelesen …
        </div>
      ) : (
        <>
          <canvas ref={canvasRef} className="w-full h-24 rounded-xl bg-card" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">Anfang — {formatSeconds(start)}</p>
              <input
                type="range" min="0" max={buffer.duration} step="0.1" value={start}
                onChange={(e) => setStart(Math.min(Number(e.target.value), end - 0.1))}
                className="w-full accent-[hsl(var(--primary))]"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground mb-1.5">Ende — {formatSeconds(end)}</p>
              <input
                type="range" min="0" max={buffer.duration} step="0.1" value={end}
                onChange={(e) => setEnd(Math.max(Number(e.target.value), start + 0.1))}
                className="w-full accent-[hsl(var(--primary))]"
              />
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground">
            Übrig bleiben {formatSeconds(Math.max(0, end - start))} von {formatSeconds(buffer.duration)}. Anfang und Ende
            kannst du auch mit den Pfeiltasten fein schieben.
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button" onClick={playing ? stop : listen}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors",
                playing ? "bg-primary text-primary-foreground" : "bg-elevated border border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {playing ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {playing ? "Stopp" : "Ausschnitt anhören"}
            </button>
            <button type="button" onClick={take} className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
              <Scissors className="w-3.5 h-3.5" /> Ausschnitt übernehmen
            </button>
          </div>
        </>
      )}
    </div>
  );
}