import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Loader2, Plus, Pencil, Volume2, Square, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import NarratorEditor from "@/components/studio/assistant/NarratorEditor";
import { kindOf, voiceLabel } from "@/lib/narratorStyle";

const TEST_LINE = "Ich bin da. Sag mir, wohin es gehen soll — ich gehe mit.";

// Die Concierge-Stimme: Aussehen, Persönlichkeit und Stimm-Typ der Erzählerinnen.
export default function ConciergePanel() {
  const { toast } = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [playingId, setPlayingId] = useState("");
  const audioRef = useRef(null);

  useEffect(() => {
    load();
    return () => audioRef.current?.pause();
  }, []);

  const load = async () => {
    const items = await base44.entities.Narrator.list("order").catch(() => []);
    setList(items);
    setLoading(false);
  };

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
      const res = await base44.integrations.Core.GenerateSpeech({ text: TEST_LINE, voice: n.voice || "honey" });
      const audio = new Audio(res.url);
      audioRef.current = audio;
      audio.onended = () => setPlayingId("");
      audio.onerror = () => setPlayingId("");
      await audio.play();
    } catch (e) {
      setPlayingId("");
      toast({ title: "Stimme kam nicht durch", description: "Versuch es nochmal.", variant: "destructive" });
    }
  };

  const saved = (n) => {
    setEditing(null);
    setList((prev) => (prev.some((x) => x.id === n.id) ? prev.map((x) => (x.id === n.id ? n : x)) : [...prev, n]));
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
            und sprechen mit dir — eine oder zwei, sie wechseln sich ab.
          </p>
        </div>
        <button
          onClick={() => setEditing({})}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn glass-btn-accent text-[14px] font-bold text-gloss"
        >
          <Plus className="w-4 h-4" /> Neue Erzählerin
        </button>
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
          {list.map((n) => (
            <div key={n.id} className="rounded-2xl border-2 border-border bg-card p-4 flex gap-4">
              {n.avatar ? (
                <Image src={n.avatar} fittingType="fill" className="w-24 h-24 rounded-2xl flex-shrink-0" />
              ) : (
                <span className="w-24 h-24 rounded-2xl bg-elevated border border-border flex items-center justify-center flex-shrink-0 font-display text-3xl text-primary">
                  {n.name.slice(0, 1)}
                </span>
              )}

              <div className="min-w-0 flex-1">
                <p className="font-display text-lg text-foreground truncate">{n.name}</p>
                <p className="text-[12px] font-bold uppercase tracking-wider text-primary mb-1">
                  {kindOf(n.kind).label} · {n.artStyle === "CARTOON" ? "Gezeichnet" : "Fotoreal"}
                </p>
                <p className="text-[13px] font-semibold text-muted-foreground line-clamp-3">
                  {n.personality || "Noch keine Persönlichkeit beschrieben."}
                </p>
                <p className="text-[12px] font-semibold text-muted-foreground mt-1.5 truncate">
                  Stimme: {voiceLabel(n.voice)}
                </p>

                <div className="flex items-center gap-1.5 mt-3">
                  <button
                    onClick={() => test(n)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[12px] font-bold transition-colors",
                      playingId === n.id ? "glass-btn glass-btn-accent text-gloss" : "glass-btn text-foreground"
                    )}
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
          ))}
        </div>
      )}
    </div>
  );
}