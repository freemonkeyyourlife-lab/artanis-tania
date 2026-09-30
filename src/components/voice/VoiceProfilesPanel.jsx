import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Loader2, Mic, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { assignVoiceToCreator } from "@/lib/voiceAssign";
import VoiceDescribeBox from "@/components/voice/VoiceDescribeBox";
import VoicePreviewButton from "@/components/voice/VoicePreviewButton";

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Der Klang in Worten: ein Wort antippen — die Stimme stellt sich darauf ein.
const WORDS = [
  { label: "tief", patch: { depth: -18 } },
  { label: "dunkel", patch: { depth: -26, speed: 0.92 } },
  { label: "hell", patch: { depth: 12 } },
  { label: "hauchen", patch: { speed: 0.9, intensity: 78, ending: 30 } },
  { label: "rauchig", patch: { mood: "HEISS", intensity: 68 } },
  { label: "warm", patch: { mood: "SANFT", speed: 0.95 } },
  { label: "weich", patch: { mood: "SANFT", intensity: 45, ending: 68 } },
  { label: "zart", patch: { mood: "SANFT", speed: 0.9, depth: -6 } },
  { label: "kratzig", patch: { depth: -8, intensity: 72 } },
  { label: "fest", patch: { mood: "ERNST", speed: 1.02, depth: -20 } },
  { label: "bestimmend", patch: { mood: "HART", speed: 1.04, depth: -26, intensity: 86 } },
  { label: "verschmitzt", patch: { mood: "SPIELERISCH", speed: 1.08, depth: 6 } },
  { label: "erotisch", patch: { mood: "VERFUEHRERISCH", speed: 0.9, depth: -14, intensity: 80 } },
  { label: "ruhig", patch: { mood: "NEUTRAL", speed: 0.98, ending: 70 } },
  { label: "langsam", patch: { speed: 0.88 } },
  { label: "schnell", patch: { speed: 1.14 } },
];

const START = { mood: "NEUTRAL", speed: 1, depth: 0, intensity: 50, ending: 50 };

// Stimmen-Profile für die Figuren — Artanis und Triania zuerst.
// Du beschreibst den Klang in Worten, daraus wird ein Profil, das du anhörst und speicherst.
export default function VoiceProfilesPanel() {
  const [creators, setCreators] = useState([]);
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [wordsFor, setWordsFor] = useState({});

  useEffect(() => { load(); }, []);

  const load = async () => {
    const [c, v] = await Promise.all([
      base44.entities.Creator.list("-created_date"),
      base44.entities.Voice.list("-created_date"),
    ]);
    const first = ["Artanis", "Triania"];
    const rank = (x) => {
      const i = first.indexOf(x.stageName);
      return i === -1 ? first.length : i;
    };
    setCreators(c.filter((x) => x.active !== false).sort((a, b) => rank(a) - rank(b)));
    setVoices(v);
    setLoading(false);
  };

  const createProfile = async (creator) => {
    const created = await base44.entities.Voice.create({
      ...START,
      name: `${creator.stageName} · Stimme`,
      description: `Stimmen-Profil für ${creator.stageName}`,
      ownerName: creator.stageName,
      baseVoice: creator.voice || "honey",
      provider: "GRUNDSTIMME",
      source: "GRUNDSTIMME",
    });
    await assignVoiceToCreator(creator.id, created.id, creators);
    setVoices((prev) => [created, ...prev]);
    setCreators((prev) => prev.map((x) => (x.id === creator.id ? { ...x, voiceProfileId: created.id } : x)));
    return created;
  };

  const applyWord = async (creator, voice, word) => {
    if (busyId) return;
    setBusyId(creator.id);
    try {
      const profile = voice || await createProfile(creator);
      const next = {
        mood: word.patch.mood || profile.mood || START.mood,
        speed: clamp(word.patch.speed ?? profile.speed ?? START.speed, 0.7, 1.4),
        depth: clamp(word.patch.depth ?? profile.depth ?? START.depth, -40, 20),
        intensity: clamp(word.patch.intensity ?? profile.intensity ?? START.intensity, 0, 100),
        ending: clamp(word.patch.ending ?? profile.ending ?? START.ending, 0, 100),
      };
      const updated = await base44.entities.Voice.update(profile.id, next);
      setVoices((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
      setWordsFor((prev) => ({ ...prev, [creator.id]: [...(prev[creator.id] || []), word.label] }));
    } catch (e) {
      console.error(e);
    } finally {
      setBusyId(null);
    }
  };

  const applyTuning = async (voice, patch) => {
    const updated = await base44.entities.Voice.update(voice.id, patch);
    setVoices((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
  };

  const resetWords = async (creator, voice) => {
    setWordsFor((prev) => ({ ...prev, [creator.id]: [] }));
    await applyTuning(voice, START);
  };

  if (loading) {
    return <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>;
  }

  if (creators.length === 0) {
    return <p className="text-sm text-muted-foreground">Noch keine Charaktere angelegt.</p>;
  }

  return (
    <div className="space-y-4">
      {creators.map((creator) => {
        const voice = voices.find((v) => v.id === creator.voiceProfileId) || null;
        const words = wordsFor[creator.id] || [];
        return (
          <div key={creator.id} className="rounded-2xl border border-border bg-elevated p-4">
            <div className="flex items-center gap-3 mb-3">
              {creator.avatar ? (
                <Image src={creator.avatar} fittingType="fill" className="w-11 h-11 rounded-full flex-shrink-0" />
              ) : (
                <span className="w-11 h-11 rounded-full bg-card flex items-center justify-center font-display text-primary flex-shrink-0">
                  {creator.stageName?.[0]}
                </span>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-foreground truncate">{creator.stageName}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {voice ? `${voice.name} · ${words.length ? words.join(" · ") : "noch ohne Worte"}` : "Noch kein Profil — tippe ein Wort an"}
                </p>
              </div>
              {voice && <VoicePreviewButton profile={voice} live />}
            </div>

            <div className="flex flex-wrap gap-1.5">
              {WORDS.map((w) => (
                <button
                  key={w.label}
                  onClick={() => applyWord(creator, voice, w)}
                  disabled={!!busyId}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors disabled:opacity-50",
                    words.includes(w.label)
                      ? "bg-primary/20 border border-primary/50 text-primary"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {w.label}
                </button>
              ))}
              {voice && (
                <button
                  onClick={() => resetWords(creator, voice)}
                  title="Profil auf Anfang stellen"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-card border border-border text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> zurücksetzen
                </button>
              )}
            </div>

            {busyId === creator.id && (
              <p className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground mt-2">
                <Loader2 className="w-3 h-3 animate-spin" /> Stellt die Stimme ein …
              </p>
            )}

            {voice && (
              <>
                <p className="text-[11px] text-muted-foreground mt-2">
                  Stimmung {voice.mood || "NEUTRAL"} · Tempo {Number(voice.speed ?? 1).toFixed(2)}× · Tonlage {voice.depth ?? 0} · Intensität {voice.intensity ?? 50} · Ausklang {voice.ending ?? 50}
                </p>
                <div className="mt-3">
                  <VoiceDescribeBox voice={voice} onApply={(patch) => applyTuning(voice, patch)} />
                </div>
              </>
            )}
          </div>
        );
      })}
      <p className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <Mic className="w-3 h-3" /> Das Profil gilt sofort — im Chat, im Video-Anruf und in der Sprechprobe.
      </p>
    </div>
  );
}