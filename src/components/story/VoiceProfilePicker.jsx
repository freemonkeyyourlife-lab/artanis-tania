import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Square, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

const TEST_LINE = "Ich bin da. Wir gehen zusammen durch diese Geschichte.";

// Ein fertiges Stimmprofil aus der Stimmenbank — oder der Grund-Stimm-Typ.
// So klingt die Erzählerin später auch wirklich im Story-Modus.
export default function VoiceProfilePicker({ value, baseVoice, onChange }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await base44.entities.Voice.list("-created_date");
        const items = Array.isArray(res) ? res : res?.items || [];
        if (alive) setProfiles(items.filter((v) => v.active !== false));
      } catch (e) {
        /* ohne Stimmenbank bleibt der Grund-Stimm-Typ */
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
      audioRef.current?.pause();
    };
  }, []);

  const chosen = profiles.find((v) => v.id === value);

  const hear = async () => {
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    try {
      const res = await base44.integrations.Core.GenerateSpeech({
        text: TEST_LINE,
        voice: chosen?.baseVoice || baseVoice || "honey",
      });
      const audio = new Audio(res.url);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.onerror = () => setPlaying(false);
      await audio.play();
    } catch (e) {
      setPlaying(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value || "")}
        disabled={loading}
        className="flex-1 min-w-0 px-4 py-2.5 rounded-xl bg-background border border-border text-[14px] text-foreground focus:outline-none focus:border-primary/50 disabled:opacity-60"
      >
        <option value="">Grund-Stimm-Typ (oben gewählt)</option>
        {profiles.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
            {v.baseVoice ? ` · ${v.baseVoice}` : ""}
            {v.language ? ` · ${v.language}` : ""}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={hear}
        className={cn(
          "inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full glass-btn text-[12px] font-bold text-foreground flex-shrink-0"
        )}
        title="Anhören"
      >
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : playing ? (
          <Square className="w-3.5 h-3.5" />
        ) : (
          <Volume2 className="w-3.5 h-3.5" />
        )}
        {playing ? "Stopp" : "Hören"}
      </button>
    </div>
  );
}