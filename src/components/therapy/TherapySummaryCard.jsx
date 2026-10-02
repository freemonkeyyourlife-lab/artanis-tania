import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Loader2, NotebookPen, Square, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { writeSummary } from "@/lib/therapySummary";
import { speakAsVoice } from "@/lib/voiceChat";
import { genderNoun, kindOf } from "@/lib/narratorStyle";

// Die Zusammenfassung kommt von der Erzählerin, nicht von der Therapeutin.
// Sie hat zugehört, sie erzählt es — mit ihrem Gesicht und ihrer Stimme.
export default function TherapySummaryCard({ session, messages, isOwner, onSaved }) {
  const [narrators, setNarrators] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [busy, setBusy] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    load();
    return () => audioRef.current?.pause();
  }, []);

  const load = async () => {
    const res = await base44.entities.Narrator
      .filter({ active: { $ne: false } }, { sort: "order", limit: 2 })
      .catch(() => null);
    const cast = res?.items || (Array.isArray(res) ? res : []);
    setNarrators(cast);
    const ids = cast.map((n) => n.voiceProfileId).filter(Boolean);
    if (!ids.length) return;
    const found = await base44.entities.Voice.filter({ id: { $in: ids } }).catch(() => null);
    const items = found?.items || (Array.isArray(found) ? found : []);
    setProfiles(Object.fromEntries(items.map((v) => [v.id, v])));
  };

  const write = async () => {
    if (!narrators.length || busy) return;
    setBusy(true);
    try {
      const text = await writeSummary({ narrators, session, messages });
      const updated = await base44.entities.TherapySession.update(session.id, {
        summary: text,
        summaryBy: narrators.map((n) => n.name).join(" & "),
        summaryAt: new Date().toISOString(),
      });
      onSaved?.(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const hear = async () => {
    if (playing) {
      audioRef.current?.pause();
      setPlaying(false);
      return;
    }
    const person = narrators[0];
    const profile = person?.voiceProfileId ? profiles[person.voiceProfileId] : null;
    setPlaying(true);
    try {
      const url = await speakAsVoice(profile || { baseVoice: person?.voice || "honey" }, session.summary);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.onerror = () => setPlaying(false);
      await audio.play();
    } catch (e) {
      setPlaying(false);
    }
  };

  if (!messages.length) return null;

  const person = narrators[0];
  const hasSummary = !!session.summary;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 mb-4">
      <div className="flex flex-wrap items-center gap-3">
        {person?.avatar ? (
          <Image src={person.avatar} fittingType="fill" className="w-11 h-11 rounded-full flex-shrink-0" />
        ) : (
          <span className="w-11 h-11 rounded-full bg-elevated border border-border flex items-center justify-center font-display text-lg text-primary flex-shrink-0">
            {person?.name?.[0] || "E"}
          </span>
        )}

        <div className="flex-1 min-w-[200px]">
          <p className="font-display text-lg text-foreground">Zusammenfassung</p>
          <p className="text-[12px] font-semibold text-muted-foreground">
            {narrators.length
              ? `${narrators.map((n) => n.name).join(" & ")} fassen zusammen — ${genderNoun(person?.gender)}, ${kindOf(person?.kind).label}`
              : "Noch keine Erzählerin eingeschaltet — im Erzähler-Studio eine aktivieren."}
          </p>
        </div>

        {hasSummary && (
          <button
            onClick={hear}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full glass-btn text-[12px] font-bold text-foreground"
          >
            {playing ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            {playing ? "Stopp" : "Vorlesen"}
          </button>
        )}

        {isOwner && narrators.length > 0 && (
          <button
            onClick={write}
            disabled={busy}
            className={cn(
              "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-bold disabled:opacity-60",
              hasSummary ? "glass-btn text-muted-foreground" : "glass-btn glass-btn-accent text-gloss"
            )}
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <NotebookPen className="w-3.5 h-3.5" />}
            {busy ? "Schreibt …" : hasSummary ? "Neu schreiben" : "Zusammenfassen"}
          </button>
        )}
      </div>

      {hasSummary ? (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-[15px] font-semibold text-foreground leading-relaxed whitespace-pre-wrap">{session.summary}</p>
          {session.summaryBy && (
            <p className="text-[11px] font-semibold text-muted-foreground mt-2">— {session.summaryBy}</p>
          )}
        </div>
      ) : (
        <p className="text-[13px] font-semibold text-muted-foreground mt-3">
          {isOwner
            ? "Noch nichts zusammengefasst. Die Erzählerin hört mit und schreibt es auf, wenn du willst."
            : "Noch keine Zusammenfassung."}
        </p>
      )}
    </div>
  );
}