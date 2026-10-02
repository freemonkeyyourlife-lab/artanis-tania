import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Flame, Loader2, Check, Sparkles, Mic, RotateCcw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import VoiceInput from "@/components/VoiceInput";
import { cn } from "@/lib/utils";
import AssistantCharacterStep from "@/components/studio/assistant/AssistantCharacterStep";
import { readMood } from "@/lib/moodDirector";
import { setPendingMood } from "@/lib/moodMode";
import { MOODS } from "@/lib/moodStyle";
import { PLAY_LEVELS } from "@/lib/playStyle";
import { SPEECH_STYLES } from "@/lib/speechStyle";

const labelOf = (list, id) => list.find((x) => x.id === id)?.label || id;

// Ein Modus für sich: Stimmung in eigenen Worten sagen — der Rest wird gesetzt.
export default function AssistantMoodMode({ creators, voices, onChanged }) {
  const { toast } = useToast();
  const [creator, setCreator] = useState(null);
  const [words, setWords] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [applied, setApplied] = useState(false);

  if (!creator) {
    return <AssistantCharacterStep creators={creators} value={creator} onChange={setCreator} />;
  }

  const voice = voices.find((v) => v.id === creator.voiceProfileId);

  const read = async () => {
    if (!words.trim()) return;
    setBusy(true);
    setResult(null);
    setApplied(false);
    try {
      setResult(await readMood({ words, creator }));
    } catch (e) {
      console.error(e);
      toast({ title: "Hat nicht geklappt", description: "Versuch es noch einmal.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  // Übernehmen: Stimmklang an die Figur, alles Übrige für das nächste Erlebnis.
  const apply = async () => {
    if (!result) return;
    setBusy(true);
    try {
      if (voice) await base44.entities.Voice.update(voice.id, result.voice);
      setPendingMood({
        creatorId: creator.id,
        moodIds: result.moodIds,
        playLevel: result.playLevel,
        styleId: result.styleId,
        styleNote: result.styleNote,
        sceneNote: result.sceneNote,
      });
      setApplied(true);
      onChanged?.();
      toast({ title: "Stimmung steht", description: "Gilt ab dem nächsten Erlebnis." });
    } catch (e) {
      console.error(e);
      toast({ title: "Hat nicht geklappt", description: "Versuch es noch einmal.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <p className="font-display text-xl text-foreground mb-1 inline-flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary" /> Stimmung einstellen
          </p>
          <p className="text-[15px] font-semibold text-muted-foreground max-w-2xl">
            Sag in eigenen Worten, wie es sich anfühlen soll — oder sprich es. Daraus werden Stimmung, Tempo,
            Wortwahl, Stimmklang und die Szene für das nächste Erlebnis gesetzt.
          </p>
        </div>
        <button
          onClick={() => {
            setCreator(null);
            setResult(null);
            setApplied(false);
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-btn text-[13px] font-bold text-muted-foreground"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Andere Figur
        </button>
      </div>

      <div className="flex items-start gap-2 mb-3">
        <textarea
          value={words}
          onChange={(e) => setWords(e.target.value)}
          rows={4}
          placeholder="Zum Beispiel: Es soll ganz langsam und nah anfangen, warmes Licht, sie nimmt sich Zeit …"
          className="flex-1 px-4 py-3 rounded-2xl bg-card border border-border text-[15px] font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
        />
        <VoiceInput
          onResult={(text) => setWords((v) => (v.trim() ? `${v.trim()} ${text}` : text))}
          className="mt-1 w-12 h-12"
        />
      </div>

      <button
        onClick={read}
        disabled={busy || !words.trim()}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass-btn glass-btn-accent text-[15px] font-bold text-gloss disabled:opacity-50"
      >
        {busy && !result ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {busy && !result ? "Wird gelesen …" : "Stimmung einstellen"}
      </button>

      {result && (
        <div className="mt-5 rounded-2xl border-2 border-border bg-card p-5">
          <p className="text-[15px] font-bold text-foreground mb-4">{result.summary}</p>

          <div className="grid sm:grid-cols-3 gap-3 mb-4">
            <div className="rounded-2xl border border-border p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Stimmung</p>
              <div className="flex flex-wrap gap-1.5">
                {result.moodIds.length === 0 ? (
                  <span className="text-[13px] font-semibold text-muted-foreground">unverändert</span>
                ) : (
                  result.moodIds.map((id) => (
                    <span key={id} className="px-3 py-1.5 rounded-full bg-primary/15 text-primary text-[12px] font-bold">
                      {labelOf(MOODS, id)}
                    </span>
                  ))
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-border p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Tempo</p>
              <span className="px-3 py-1.5 rounded-full bg-elevated border border-border text-[12px] font-bold text-foreground">
                {labelOf(PLAY_LEVELS, result.playLevel)}
              </span>
            </div>
            <div className="rounded-2xl border border-border p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Wortwahl</p>
              <span className="px-3 py-1.5 rounded-full bg-elevated border border-border text-[12px] font-bold text-foreground">
                {result.styleId ? labelOf(SPEECH_STYLES, result.styleId) : "unverändert"}
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-border p-3 mb-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 inline-flex items-center gap-1.5">
              <Mic className="w-3.5 h-3.5" /> Stimmklang
            </p>
            <p className="text-[13px] font-semibold text-foreground">
              {voice ? voice.name : "Keine Stimme zugeordnet"}
              {voice && ` · ${result.voice.mood} · Tempo ${result.voice.speed} · Tiefe ${result.voice.depth} · Intensität ${result.voice.intensity}`}
            </p>
            {!voice && (
              <p className="text-[12px] font-semibold text-muted-foreground mt-1">
                Die Figur hat noch keine Stimme — ordne sie im Assistenten zu, dann greift der Klang auch.
              </p>
            )}
          </div>

          {result.sceneNote && (
            <div className="rounded-2xl border border-border p-3 mb-4">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Szene für das nächste Erlebnis</p>
              <p className="text-[14px] font-semibold text-foreground leading-relaxed">{result.sceneNote}</p>
            </div>
          )}

          <button
            onClick={apply}
            disabled={busy || applied}
            className={cn(
              "inline-flex items-center gap-2 px-6 py-3 rounded-full text-[15px] font-bold disabled:opacity-50",
              applied ? "bg-emerald-600/20 text-emerald-400" : "glass-btn glass-btn-accent text-gloss"
            )}
          >
            {busy && result ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {applied ? "Übernommen — gilt ab dem nächsten Erlebnis" : "Übernehmen"}
          </button>
        </div>
      )}
    </div>
  );
}