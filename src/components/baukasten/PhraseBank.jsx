import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Search, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import PhraseCard from "@/components/baukasten/PhraseCard";
import PhraseForm from "@/components/baukasten/PhraseForm";
import { PHRASE_STAGES, stageLabel } from "@/lib/phrases";

// Die Stimmbank für Sätze: pro Stufe und Situation eine Zeile, die du dir
// vorher anhören kannst. Im Baustein wird daraus ein Grundgerüst.
export default function PhraseBank({ phrases, voices, onChange }) {
  const [form, setForm] = useState(null);
  const [stageFilter, setStageFilter] = useState("");
  const [query, setQuery] = useState("");
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [notice, setNotice] = useState("");

  const shown = phrases.filter((p) => {
    if (stageFilter && p.stage !== stageFilter) return false;
    if (onlyFavorites && !p.favorite) return false;
    if (!query.trim()) return true;
    return [p.text, p.situation, ...(p.tags || [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase()
      .includes(query.trim().toLowerCase());
  });

  const byStage = PHRASE_STAGES.map((s) => ({
    ...s,
    items: shown.filter((p) => p.stage === s.id),
  })).filter((s) => s.items.length > 0);

  // Beim ersten Anhören wird die Zeile gesprochen und bleibt dann liegen —
  // jedes weitere Anhören kostet nichts mehr.
  const play = async (phrase) => {
    try {
      let url = phrase.audioUrl;
      if (!url) {
        const profile = voices.find((v) => v.id === phrase.voiceProfileId);
        const res = await base44.integrations.Core.GenerateSpeech({
          text: phrase.text,
          voice: profile?.baseVoice || phrase.voice,
        });
        url = res?.url;
        if (!url) throw new Error("kein Ton");
        await base44.entities.VoicePhrase.update(phrase.id, { audioUrl: url });
        onChange();
      }
      await new Audio(url).play();
    } catch (e) {
      setNotice("Die Stimme kam nicht durch — versuch es nochmal.");
    }
  };

  const toggleFavorite = async (phrase) => {
    await base44.entities.VoicePhrase.update(phrase.id, { favorite: !phrase.favorite });
    onChange();
  };

  const remove = async (phrase) => {
    if (!window.confirm("Diese Sprechzeile wirklich löschen?")) return;
    await base44.entities.VoicePhrase.delete(phrase.id);
    setNotice("Sprechzeile gelöscht.");
    onChange();
  };

  return (
    <div>
      <div className="glass rounded-2xl border-2 border-border p-5 mb-5">
        <p className="font-display text-xl text-foreground mb-1">Sprechzeilen in Stufen</p>
        <p className="text-[15px] font-semibold text-muted-foreground">
          Sechs Stufen, von der Begrüßung bis zum Schluss — und für jede Situation die passende Zeile.
          Hör sie dir hier an, dann weißt du vorher, wie sie klingt. Im Baustein holst du sie mit
          einem Klick als Grundgerüst und schreibst sie weiter.
        </p>
      </div>

      {notice && (
        <p className="glass rounded-xl border border-border px-4 py-3 text-[15px] font-bold text-primary mb-5">{notice}</p>
      )}

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <button
          onClick={() => setForm({})}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn glass-btn-accent text-[14px] font-bold text-gloss"
        >
          <Plus className="w-4 h-4" /> Neue Sprechzeile
        </button>
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suchen"
            className="h-10 pl-9 w-56 text-[14px] font-semibold"
          />
        </div>
        <button
          onClick={() => setOnlyFavorites((v) => !v)}
          className={cn(
            "inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full border-2 text-[13px] font-bold transition-colors",
            onlyFavorites ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
          )}
        >
          <Star className={cn("w-3.5 h-3.5", onlyFavorites && "fill-current")} /> Gemerkt
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-5">
        <button
          onClick={() => setStageFilter("")}
          className={cn(
            "px-3.5 py-2 rounded-full border-2 text-[13px] font-bold transition-colors",
            !stageFilter ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
          )}
        >
          Alle Stufen
        </button>
        {PHRASE_STAGES.map((s) => (
          <button
            key={s.id}
            onClick={() => setStageFilter(stageFilter === s.id ? "" : s.id)}
            title={s.hint}
            className={cn(
              "px-3.5 py-2 rounded-full border-2 text-[13px] font-bold transition-colors",
              stageFilter === s.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {form && (
        <div className="mb-6">
          <PhraseForm
            initial={form.id ? form : null}
            onSaved={() => { setForm(null); setNotice("Sprechzeile gespeichert."); onChange(); }}
            onCancel={() => setForm(null)}
          />
        </div>
      )}

      {byStage.length === 0 ? (
        <p className="text-[15px] font-semibold text-muted-foreground text-center py-16">
          Noch keine Sprechzeilen — leg die erste an.
        </p>
      ) : (
        <div className="space-y-8">
          {byStage.map((s) => (
            <div key={s.id}>
              <p className="font-display text-lg text-foreground mb-1">{s.label}</p>
              <p className="text-[13px] font-semibold text-muted-foreground mb-3">{s.hint}</p>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {s.items.map((p) => (
                  <PhraseCard
                    key={p.id}
                    phrase={p}
                    onEdit={setForm}
                    onDelete={remove}
                    onPlay={play}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}