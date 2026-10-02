import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Loader2, Plus, Pencil, Volume2, Square, Trash2, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import NarratorEditor from "@/components/studio/assistant/NarratorEditor";
import { genderNoun, kindOf, voiceLabel } from "@/lib/narratorStyle";
import { speakAsVoice } from "@/lib/voiceChat";

const TEST_LINE = "Ich bin da. Sag mir, wohin es gehen soll — ich gehe mit.";

// Die Concierge-Stimme: Aussehen, Persönlichkeit und Stimm-Typ der Erzählerinnen.
// Höchstens zwei sind gleichzeitig im Story-Modus aktiv — sie wechseln sich dort ab.
export default function ConciergePanel() {
  const { toast } = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [playingId, setPlayingId] = useState("");
  const [voiceNames, setVoiceNames] = useState({});
  const [voiceProfiles, setVoiceProfiles] = useState({});
  const audioRef = useRef(null);

  useEffect(() => {
    load();
    return () => audioRef.current?.pause();
  }, []);

  // Nie mehr als zwei aktive — der Rest wird still abgeschaltet.
  const load = async () => {
    const [items, voices] = await Promise.all([
      base44.entities.Narrator.list("order").catch(() => []),
      base44.entities.Voice.list("-created_date").catch(() => []),
    ]);
    const voiceItems = Array.isArray(voices) ? voices : voices?.items || [];
    setVoiceNames(Object.fromEntries(voiceItems.map((v) => [v.id, v.name])));
    setVoiceProfiles(Object.fromEntries(voiceItems.map((v) => [v.id, v])));
    const on = items.filter((x) => x.active !== false);
    if (on.length > 2) {
      const drop = on.slice(2);
      await Promise.all(drop.map((d) => base44.entities.Narrator.update(d.id, { active: false })));
      setList(items.map((x) => (drop.some((d) => d.id === x.id) ? { ...x, active: false } : x)));
    } else {
      setList(items);
    }
    setLoading(false);
  };

  const activeList = list.filter((x) => x.active !== false);
  const slotOf = (n) => activeList.findIndex((x) => x.id === n.id) + 1;

  const stop = () => {
    audioRef.current?.pause();
    setPlayingId("");
  };

  // Kurz reinhören — so klingt sie, wenn sie im Story-Modus über die Schulter schaut.
  const test = async (n) => {
    if (playingId === n.id) return stop();
    stop();
    setPlayingId(n.id);
    try {
      // Genau ihre Stimme — auch eine aus ElevenLabs.
      const url = await speakAsVoice(voiceProfiles[n.voiceProfileId] || { baseVoice: n.voice || "honey" }, TEST_LINE);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setPlayingId("");
      audio.onerror = () => setPlayingId("");
      await audio.play();
    } catch (e) {
      setPlayingId("");
      toast({ title: "Stimme kam nicht durch", description: "Versuch es nochmal.", variant: "destructive" });
    }
  };

  // Zwei Plätze. Ist alles voll, macht die erste Platz für die neue.
  const toggleActive = async (n) => {
    const next = n.active === false;
    if (next && activeList.length >= 2) {
      await base44.entities.Narrator.update(activeList[0].id, { active: false });
    }
    await base44.entities.Narrator.update(n.id, { active: next });
    load();
  };

  const saved = async (n) => {
    setEditing(null);
    await load();
    toast({ title: "Gespeichert", description: `„${n.name}" ist eingerichtet.` });
  };

  const remove = async (n) => {
    if (!window.confirm(`„${n.name}" entfernen?`)) return;
    await base44.entities.Narrator.delete(n.id);
    setList((prev) => prev.filter((x) => x.id !== n.id));
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-display text-2xl text-foreground">Concierge-Stimme</p>
          <p className="text-[15px] font-semibold text-muted-foreground max-w-2xl leading-relaxed">
            Aussehen, Persönlichkeit und Stimm-Typ der Erzählerinnen. Sie führen durch den Story-Modus, geben Tipps
            und sprechen mit dir — zwei dürfen gleichzeitig dabei sein und wechseln sich ab.
          </p>
        </div>
        <button
          onClick={() => setEditing({})}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn glass-btn-accent text-[14px] font-bold text-gloss"
        >
          <Plus className="w-4 h-4" /> Neue Erzählerin
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-2.5 rounded-2xl border-2 border-border bg-card px-4 py-3">
        <Users className="w-4 h-4 text-primary flex-shrink-0" />
        <p className="text-[14px] font-semibold text-foreground">
          Im Story-Modus aktiv:{" "}
          {activeList.length
            ? activeList.map((n) => n.name).join(" und ")
            : "noch niemand — schalte unten jemanden ein."}
        </p>
        <span className="ml-auto text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
          {activeList.length} von 2 Plätzen
        </span>
      </div>

      {editing && (
        <div className="rounded-2xl border-2 border-primary/30 bg-card p-5">
          <NarratorEditor
            narrator={editing.id ? editing : null}
            onSaved={saved}
            onDeleted={(id) => { setEditing(null); setList((prev) => prev.filter((x) => x.id !== id)); }}
            onCancel={() => setEditing(null)}
            onError={() => toast({ title: "Hat nicht geklappt", variant: "destructive" })}
          />
        </div>
      )}

      {list.length === 0 ? (
        <p className="text-[15px] font-semibold text-muted-foreground text-center py-16">
          Noch keine Erzählerin — leg deine erste an.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {list.map((n) => {
            const slot = slotOf(n);
            return (
              <div
                key={n.id}
                className={cn(
                  "rounded-2xl border-2 bg-card p-4 flex gap-4",
                  slot ? "border-primary/50" : "border-border"
                )}
              >
                {n.avatar ? (
                  <Image src={n.avatar} fittingType="fill" className="w-24 h-24 rounded-2xl flex-shrink-0" />
                ) : (
                  <span className="w-24 h-24 rounded-2xl bg-elevated border border-border flex items-center justify-center flex-shrink-0 font-display text-3xl text-primary">
                    {n.name.slice(0, 1)}
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-display text-lg text-foreground truncate">{n.name}</p>
                    {slot > 0 && (
                      <span className="px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                        {genderNoun(n.gender)} {slot}
                      </span>
                    )}
                  </div>
                  <p className="text-[12px] font-bold uppercase tracking-wider text-primary mb-1">
                    {kindOf(n.kind).label} · {n.artStyle === "CARTOON" ? "Gezeichnet" : "Fotoreal"}
                  </p>
                  <p className="text-[13px] font-semibold text-muted-foreground line-clamp-3">
                    {n.personality || "Noch keine Persönlichkeit beschrieben."}
                  </p>
                  {n.appearance && (
                    <p className="text-[12px] font-semibold text-muted-foreground mt-1 line-clamp-2">
                      Aussehen: {n.appearance}
                    </p>
                  )}
                  <p className="text-[12px] font-semibold text-muted-foreground mt-1.5 truncate">
                    Stimme: {voiceNames[n.voiceProfileId] || voiceLabel(n.voice)}
                  </p>

                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    <button
                      onClick={() => toggleActive(n)}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-bold transition-colors",
                        slot ? "glass-btn glass-btn-accent text-gloss" : "glass-btn text-muted-foreground"
                      )}
                    >
                      <Users className="w-3 h-3" /> {slot ? "Im Story-Modus" : "Einschalten"}
                    </button>
                    <button
                      onClick={() => test(n)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full glass-btn text-[12px] font-bold text-foreground"
                    >
                      {playingId === n.id ? <Square className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                      {playingId === n.id ? "Stopp" : "Hören"}
                    </button>
                    <button
                      onClick={() => { stop(); setEditing(n); }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full glass-btn text-[12px] font-bold text-foreground"
                    >
                      <Pencil className="w-3 h-3" /> Einrichten
                    </button>
                    <button
                      onClick={() => remove(n)}
                      className="ml-auto w-8 h-8 rounded-full bg-destructive/15 text-destructive flex items-center justify-center hover:bg-destructive/25 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}