import React, { useState } from "react";
import { Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { EXPLICIT_LEVELS, MOODS, styleOptions } from "@/lib/modelTags";
import ModelTagsPicker from "@/components/studio/ModelTagsPicker";

const chip = "inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider";

// Die Kategorien eines Modells als Etiketten — und auf Klick gleich änderbar.
export default function ModelTags({ kind = "BILD", model, editable = false, onSave, className }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);

  const style = styleOptions(kind).find((s) => s.id === model?.style);
  const explicit = EXPLICIT_LEVELS.find((e) => e.id === model?.explicit);
  const moods = MOODS.filter((m) => (model?.moods || []).includes(m.id));
  const any = style || explicit || moods.length;

  const start = () => {
    setDraft({ style: model?.style || "", explicit: model?.explicit || "", moods: model?.moods || [] });
    setOpen(true);
  };

  const save = async () => {
    setBusy(true);
    try { await onSave?.(draft); } finally { setBusy(false); setOpen(false); }
  };

  if (open) {
    return (
      <div className={cn("rounded-2xl border border-border bg-background p-3", className)}>
        <ModelTagsPicker kind={kind} value={draft} onChange={setDraft} />
        <div className="flex gap-2 mt-3">
          <button
            onClick={save}
            disabled={busy}
            className="px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold disabled:opacity-50"
          >
            Speichern
          </button>
          <button
            onClick={() => setOpen(false)}
            className="px-4 py-1.5 rounded-full bg-elevated border border-border text-[11px] font-bold text-muted-foreground"
          >
            Abbrechen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
      {style && <span className={cn(chip, style.tone)}>{style.label}</span>}
      {explicit && <span className={cn(chip, explicit.tone)}>{explicit.label}</span>}
      {moods.map((m) => (
        <span key={m.id} className={cn(chip, m.tone)}>{m.label}</span>
      ))}
      {!any && editable && (
        <span className="text-[11px] text-muted-foreground italic">Noch keine Kategorie</span>
      )}
      {editable && (
        <button
          onClick={start}
          title="Kategorien ändern"
          className="w-7 h-7 rounded-full bg-background border border-border text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors"
        >
          <Pencil className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}