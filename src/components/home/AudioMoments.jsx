import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Play, Pause, Loader2, Volume2, Mic } from "lucide-react";
import { cn } from "@/lib/utils";

// Audio-Momente auf der Startseite: kurze Stimmproben aus der Stimmbank
// (VoicePhrase) mit einem Play-Knopf. Ohne eigene Logik — nur Anzeige.
// Stimmproben sind nur für die Besitzerin sichtbar; Besucher sehen einen
// dezenten Hinweis, falls nichts Öffentliches vorliegt.

const STAGE_LABEL = {
  ANKOMMEN: "Ankommen",
  SMALLTALK: "Smalltalk",
  ANMACHE: "Anmache",
  HEISS: "Heiß",
  ESKALATION: "Eskalation",
  ABSCHLUSS: "Abschluss",
};

const resolveUrl = async (u) => {
  if (!u) return null;
  if (u.startsWith("http")) return u;
  try {
    const r = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: u });
    return r?.signed_url || null;
  } catch {
    return null;
  }
};

function AudioMoment({ phrase, url, playing, onToggle }) {
  const audioRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) a.play().catch(() => {});
    else a.pause();
  }, [playing, url]);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          disabled={!url}
          className={cn(
            "glass-btn inline-flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full disabled:opacity-40",
            playing && "glass-btn-accent"
          )}
          title={playing ? "Pause" : "Abspielen"}
        >
          {!url ? <Loader2 className="h-5 w-5 animate-spin" /> : playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
              {STAGE_LABEL[phrase.stage] || phrase.stage || "Moment"}
            </span>
            <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <p className="mt-1.5 text-sm text-foreground line-clamp-2">{phrase.text || phrase.situation || "Stimmprobe"}</p>
        </div>
      </div>

      {/* Dünner Fortschrittsbalken */}
      <div className="h-1 w-full overflow-hidden rounded-full bg-background">
        <div className="h-full bg-primary transition-[width] duration-150" style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }} />
      </div>

      {url && (
        <audio
          ref={audioRef}
          src={url}
          onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration || 0)}
          onEnded={onToggle}
          preload="none"
        />
      )}
    </div>
  );
}

export default function AudioMoments() {
  const [phrases, setPhrases] = useState([]);
  const [urls, setUrls] = useState({});
  const [playingId, setPlayingId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.VoicePhrase.filter({ active: true }, "-created_date", 6)
      .then((rows) => setPhrases(Array.isArray(rows) ? rows : []))
      .catch(() => setPhrases([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    (async () => {
      const next = {};
      for (const p of phrases) {
        if (!urls[p.id] && p.audioUrl) next[p.id] = await resolveUrl(p.audioUrl);
      }
      if (Object.keys(next).length) setUrls((u) => ({ ...u, ...next }));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phrases]);

  if (loading) return null;
  if (phrases.length === 0) return null;

  const toggle = (id) => setPlayingId((cur) => (cur === id ? null : id));

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-2xl text-foreground flex items-center gap-2">
          <Mic className="w-5 h-5 text-primary" /> Audio-Momente
        </h2>
        <Link to="/stimmen" className="text-sm text-primary hover:underline">Zur Stimmbank</Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {phrases.map((p) => (
          <AudioMoment key={p.id} phrase={p} url={urls[p.id]} playing={playingId === p.id} onToggle={() => toggle(p.id)} />
        ))}
      </div>
    </div>
  );
}