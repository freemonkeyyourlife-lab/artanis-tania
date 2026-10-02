import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Play, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveVoice, cloudTuning, playVolume, fineTuning } from "@/lib/voiceDj";

const SAMPLE_TEXT = "Hey … ich bin's. Bleib kurz da, ich will dir was sagen.";

// Tempo und Tonlage in einen Reglerwert — so klingt es sofort anders, ohne neu zu laden.
const liveRate = (p) => {
  const speed = typeof p?.speed === "number" ? p.speed : 1;
  const depth = typeof p?.depth === "number" ? p.depth : 0;
  const pitch = Math.max(0.5, Math.min(1.6, 1 + depth / 100));
  return Math.max(0.5, Math.min(2, speed * pitch));
};

// Hört sich die eingestellte Stimme an — genau so, wie sie später im Chat klingt.
// Mit `live` hörst du jede Drehung sofort, während der Ton weiterläuft.
export default function VoicePreviewButton({ profile, text = SAMPLE_TEXT, className, onCached, useSample = true, live = false }) {
  const [state, setState] = useState("idle");
  const audioRef = useRef(null);
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const isCloud = profile?.provider === "ELEVENLABS" && !!profile?.externalVoiceId;
  // Beim Live-Drehen zählt die eingestellte Stimme — nicht die rohe Aufnahme.
  const playSample = useSample && !live && !!profile?.sampleFile;

  const stop = () => {
    if (audioRef.current) audioRef.current.pause();
    audioRef.current = null;
    setState("idle");
  };

  const play = async () => {
    const p = profileRef.current;
    const v = resolveVoice(p);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setState("loading");
    try {
      // Liegt eine eigene Aufnahme vor, hörst du genau die — sonst die eingestellte Stimme.
      let url;
      let rate = v.audioRate;
      if (playSample) {
        const res = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: p.sampleFile, expires_in: 600 });
        url = res?.signed_url;
        rate = p.sampleCached ? cloudTuning(p).pitch : 1;
      } else if (p?.provider === "ELEVENLABS" && p?.externalVoiceId) {
        const tune = cloudTuning(p);
        const res = await base44.functions.invoke("elevenLabs", {
          voiceId: p.externalVoiceId,
          text,
          speed: tune.apiSpeed,
          mood: p.mood,
          intensity: tune.intensity,
          ending: p.ending,
          tuning: fineTuning(p),
        });
        if (res.data?.error) throw new Error(res.data.error);
        url = res.data.url;
        rate = tune.pitch;
        // Nur die feste Hörprobe ablegen — freie Texte nicht, damit die Originalaufnahme erhalten bleibt.
        if (res.data.file_uri && p.id && !p.sampleFile && text === SAMPLE_TEXT) {
          await base44.entities.Voice.update(p.id, { sampleFile: res.data.file_uri, sampleCached: true });
          onCached?.();
        }
      } else {
        const res = await base44.integrations.Core.GenerateSpeech({ text, voice: v.baseVoice });
        url = res?.url;
      }
      if (!url) throw new Error("Keine Stimme erhalten");
      const audio = new Audio(url);
      audio.preservesPitch = false;
      audio.webkitPreservesPitch = false;
      audio.playbackRate = rate;
      audio.volume = playVolume(p);
      audio.onended = () => setState("idle");
      audio.onerror = () => setState("idle");
      audioRef.current = audio;
      await audio.play();
      setState("playing");
    } catch (e) {
      console.error(e);
      setState("idle");
    }
  };

  // Live: Tonlage und Tempo wirken sofort auf den laufenden Ton. Bei einer
  // geklonten Stimme muss sie kurz neu erzeugt werden — dann hört man sie neu.
  const tuneKey = live ? [profile?.speed, profile?.depth, profile?.mood, profile?.intensity, profile?.ending].join("|") : "";
  const mounted = useRef(false);
  useEffect(() => {
    if (!live) return;
    if (!mounted.current) { mounted.current = true; return; }
    const audio = audioRef.current;
    if (!audio) return;
    if (isCloud) {
      audio.playbackRate = cloudTuning(profileRef.current).pitch;
      const t = setTimeout(() => { play(); }, 900);
      return () => clearTimeout(t);
    }
    audio.playbackRate = liveRate(profileRef.current);
  }, [tuneKey, live, isCloud]);

  // Lautstärke greift sofort auf den laufenden Ton — ohne ihn neu zu erzeugen.
  const volumeKey = live ? Number(profile?.volume ?? 100) : 0;
  useEffect(() => {
    if (!live || !audioRef.current) return;
    audioRef.current.volume = playVolume(profileRef.current);
  }, [volumeKey, live]);

  // Andere Wortwahl: der Satz wird neu gesprochen, sobald du aufhörst zu tippen.
  const textReady = useRef(false);
  useEffect(() => {
    if (!live) return;
    if (!textReady.current) { textReady.current = true; return; }
    const t = setTimeout(() => { play(); }, 1200);
    return () => clearTimeout(t);
  }, [text, live]);

  useEffect(() => () => { if (audioRef.current) audioRef.current.pause(); }, []);

  return (
    <button
      type="button"
      onClick={() => (state === "playing" ? stop() : play())}
      disabled={state === "loading"}
      title={live ? "Stimme anhören — dreh an den Reglern, während sie läuft" : "Stimme anhören"}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-50",
        state === "playing" ? "bg-primary text-primary-foreground" : "bg-elevated border border-border text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {state === "loading" ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : state === "playing" ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
      {state === "loading" ? "Lädt …" : state === "playing" ? "Stopp" : live ? "Anhören · live" : "Anhören"}
    </button>
  );
}