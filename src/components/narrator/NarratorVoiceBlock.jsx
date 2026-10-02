import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Check, Loader2, Play, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { NARRATOR_VOICES } from "@/lib/narratorStyle";
import { MOODS, moodPreset } from "@/lib/voiceDj";
import { speakAsVoice } from "@/lib/voiceChat";
import VoiceProfilePicker from "@/components/story/VoiceProfilePicker";
import { labelCls, chipCls, btnCls, btnAccentCls } from "@/lib/narratorUi";

const TEST_LINE = "Ich bin da. Sag mir, wohin es gehen soll — ich gehe mit.";

// Stimmen-Creator und Bearbeiter: Grundstimme wählen, ein Stimmprofil nehmen
// und es hier fein einstellen — hören, solange du drehst.
export default function NarratorVoiceBlock({ narrator, onSaved }) {
  const [voice, setVoice] = useState(narrator?.voice || "honey");
  const [profileId, setProfileId] = useState(narrator?.voiceProfileId || "");
  const [profile, setProfile] = useState(null);
  const [speed, setSpeed] = useState(1);
  const [depth, setDepth] = useState(0);
  const [mood, setMood] = useState("NEUTRAL");
  const [playing, setPlaying] = useState(false);
  const [note, setNote] = useState("");
  const audioRef = useRef(null);

  useEffect(
    () => () => {
      audioRef.current?.pause();
    },
    []
  );

  // Das gewählte Profil laden — seine Regler stehen dann hier.
  useEffect(() => {
    if (!profileId) {
      setProfile(null);
      return undefined;
    }
    let alive = true;
    (async () => {
      try {
        const v = await base44.entities.Voice.get(profileId);
        if (!alive || !v) return;
        setProfile(v);
        setSpeed(typeof v.speed === "number" ? v.speed : 1);
        setDepth(typeof v.depth === "number" ? v.depth : 0);
        setMood(v.mood || "NEUTRAL");
      } catch (e) {
        /* ohne Profil bleibt die Grundstimme */
      }
    })();
    return () => {
      alive = false;
    };
  }, [profileId]);

  const pickVoice = async (id) => {
    setVoice(id);
    const rec = await base44.entities.Narrator.update(narrator.id, { voice: id });
    onSaved?.(rec);
  };

  const pickProfile = async (id) => {
    setProfileId(id);
    const rec = await base44.entities.Narrator.update(narrator.id, { voiceProfileId: id });
    onSaved?.(rec);
  };

  const sound = () => ({ ...(profile || {}), baseVoice: voice, speed, depth, mood });

  const hear = async () => {
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }
    setNote("");
    setPlaying(true);
    try {
      const url = await speakAsVoice(sound(), TEST_LINE, { fast: true });
      if (!url) throw new Error("keine Stimme");
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.onerror = () => setPlaying(false);
      await audio.play();
    } catch (e) {
      setNote("Die Stimme kam nicht zurück — nochmal versuchen.");
      setPlaying(false);
    }
  };

  const saveTuning = async () => {
    if (!profile?.id) return;
    setNote("");
    await base44.entities.Voice.update(profile.id, { speed, depth, mood });
    setNote("Am Profil gespeichert.");
  };

  return (
    <div>
      <label className={labelCls}>Grundstimme</label>
      <div className="flex flex-wrap gap-1.5">
        {NARRATOR_VOICES.map((v) => (
          <button key={v.id} onClick={() => pickVoice(v.id)} className={chipCls(voice === v.id)}>
            {v.label} <span className="font-semibold opacity-70">{v.hint}</span>
          </button>
        ))}
      </div>

      <label className={cn(labelCls, "mt-4")}>Stimmprofil</label>
      <VoiceProfilePicker value={profileId} baseVoice={voice} onChange={pickProfile} />

      {profile && (
        <>
          <label className={cn(labelCls, "mt-4")}>Feinschliff — am Profil „{profile.name}"</label>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {MOODS.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  setMood(m.id);
                  setSpeed(moodPreset(m.id).speed);
                  setDepth(moodPreset(m.id).depth);
                }}
                className={chipCls(mood === m.id)}
              >
                {m.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Tempo · {speed.toFixed(2)}</label>
              <input
                type="range"
                min="0.7"
                max="1.3"
                step="0.02"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
            <div>
              <label className={labelCls}>Tiefe · {depth}</label>
              <input
                type="range"
                min="-40"
                max="40"
                step="1"
                value={depth}
                onChange={(e) => setDepth(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </div>

          <button onClick={saveTuning} className={cn(btnCls, "mt-3")}>
            <Check className="w-4 h-4" /> Am Profil speichern
          </button>
        </>
      )}

      <div className="flex flex-wrap items-center gap-2 mt-4">
        <button onClick={hear} className={btnAccentCls}>
          {playing ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          {playing ? "Stopp" : "Anhören"}
        </button>
        {!profile && <span className="text-[12px] font-semibold text-muted-foreground">Ohne Profil spricht sie mit der Grundstimme.</span>}
        {note && <span className="text-[12px] font-semibold text-muted-foreground">{note}</span>}
      </div>
    </div>
  );
}