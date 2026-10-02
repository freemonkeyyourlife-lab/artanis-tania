import React, { useState } from "react";
import { Check, Archive as ArchiveIcon, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import VoiceInput from "@/components/VoiceInput";
import { BUILDKIT_AXES, BUILDKIT_LINES, BUILDKIT_MISSING } from "@/lib/introStory";

// Der Baukasten: vier Schrauben, frei kombinierbar. Frau, Geschichte, Szenario,
// Rolle — und was es noch nicht gibt, wird aufgenommen.
export default function IntroBuildKit({ axes = BUILDKIT_AXES, axis = 0, values = {}, onPick, onAxis, onArchive }) {
  const [missing, setMissing] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const current = axes[axis] || axes[0];
  if (!current) return null;

  const chosen = (id) => axes.find((a) => a.id === id)?.options.find((o) => o.id === values[id]);
  const combination = axes
    .map((a) => (chosen(a.id) ? `${a.label}: ${chosen(a.id).label}` : ""))
    .filter(Boolean);

  const submit = async () => {
    if (!missing.trim() || busy) return;
    setBusy(true);
    try {
      await onArchive?.(missing, combination);
      setSent(true);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-3">Der Baukasten</p>
      <h2 className="font-display text-3xl lg:text-4xl text-foreground text-gloss mb-2">{BUILDKIT_LINES[0]}</h2>
      <p className="text-[15px] font-semibold text-muted-foreground mb-5 max-w-xl">{BUILDKIT_LINES[1]}</p>

      {/* Die vier Schrauben — sie führt ihn eine nach der anderen durch. */}
      <div className="flex flex-wrap gap-2 mb-4">
        {axes.map((a, i) => {
          const pick = chosen(a.id);
          return (
            <button
              key={a.id}
              onClick={() => onAxis?.(i)}
              className={cn(
                "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold border-2 transition-colors",
                i === axis ? "border-primary text-foreground" : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {pick ? <Check className="w-3.5 h-3.5 text-primary" /> : <span className="text-primary">{i + 1}.</span>}
              {a.label}
            </button>
          );
        })}
      </div>

      <p className="text-[16px] font-bold text-foreground mb-3">{current.question}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        {current.options.map((o) => {
          const on = values[current.id] === o.id;
          return (
            <button
              key={o.id}
              onClick={() => onPick?.(current.id, o.id)}
              className={cn(
                "text-left rounded-2xl border-2 p-3.5 transition-colors",
                on ? "glass-btn glass-btn-accent border-transparent text-gloss" : "border-border hover:border-primary/50"
              )}
            >
              <p className={cn("font-display text-[15px]", on ? "text-primary-foreground" : "text-foreground")}>{o.label}</p>
              <p className={cn("text-[13px] font-semibold mt-1", on ? "text-primary-foreground/80" : "text-muted-foreground")}>{o.hint}</p>
            </button>
          );
        })}
      </div>

      {combination.length > 0 && (
        <p className="text-[13px] font-bold text-primary mt-4">Deine Kombination: {combination.join(" + ")}</p>
      )}

      {/* Was es noch nicht gibt — es wird trotzdem aufgenommen. */}
      <div className="mt-6 pt-5 border-t-2 border-border">
        <p className="text-[15px] font-semibold text-foreground mb-3 max-w-xl">{BUILDKIT_MISSING}</p>
        <div className="flex items-start gap-2">
          <input
            value={missing}
            onChange={(e) => { setMissing(e.target.value); setSent(false); }}
            placeholder="Was fehlt dir? Sag es oder schreib es."
            className="flex-1 rounded-2xl border-2 border-input bg-transparent px-4 py-3 text-[15px] font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
          <VoiceInput onResult={(t) => { setMissing((m) => (m ? `${m} ${t}` : t)); setSent(false); }} className="w-12 h-12" />
          <button
            onClick={submit}
            disabled={!missing.trim() || busy}
            className="inline-flex items-center gap-1.5 px-5 py-3 rounded-full glass-btn glass-btn-accent text-[14px] font-bold text-gloss disabled:opacity-40"
          >
            {sent ? <ArchiveIcon className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {sent ? "Liegt im Archiv" : "Ins Archiv aufnehmen"}
          </button>
        </div>
      </div>
    </div>
  );
}