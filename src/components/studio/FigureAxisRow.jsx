import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Mic, Check, Loader2 } from "lucide-react";
import VoiceTextArea from "@/components/voice/SpeakField";
import { saveNote } from "@/lib/figureRaster";

// Eine Achse des Rasters: die Möglichkeiten als Reihe, darunter deine Worte zu
// der, die du gewählt hast.
export default function FigureAxisRow({ axis, picked, onPick, onSaved }) {
  const [note, setNote] = useState("");
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const chosen = (axis.options || []).find((o) => o.label === picked);

  const startEdit = () => {
    setNote(chosen?.note || "");
    setEditing(true);
  };

  const save = async () => {
    setBusy(true);
    try {
      const rec = await saveNote(axis, picked, note.trim());
      onSaved?.(rec);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="py-3 border-b border-border last:border-b-0">
      <div className="flex items-baseline gap-3 mb-2">
        <span className="text-[14px] font-bold text-foreground">{axis.name}</span>
        {axis.hint && <span className="text-[12px] font-semibold text-muted-foreground">{axis.hint}</span>}
      </div>

      <div className="flex flex-wrap gap-2">
        {(axis.options || []).map((o) => (
          <button
            key={o.label}
            onClick={() => onPick(picked === o.label ? "" : o.label)}
            className={cn(
              "px-3 py-1.5 rounded-full text-[13px] font-bold border transition-colors",
              picked === o.label
                ? "glass-btn glass-btn-accent"
                : "bg-background border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {o.label}
            {o.note ? <span className="ml-1.5 text-[11px] opacity-70">●</span> : null}
          </button>
        ))}
      </div>

      {chosen && !editing && (
        <button
          onClick={startEdit}
          className="mt-2 flex items-center gap-1.5 text-[12px] font-bold text-muted-foreground hover:text-foreground"
        >
          <Mic className="w-3.5 h-3.5" />
          {chosen.note ? `Deine Worte: ${chosen.note}` : "Deine Worte dazu sagen"}
        </button>
      )}

      {chosen && editing && (
        <div className="mt-2">
          <VoiceTextArea
            value={note}
            onChange={setNote}
            rows={2}
            placeholder="Was meinst du damit? Sprich es einfach — das geht in den Prompt mit ein."
          />
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={save}
              disabled={busy}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full glass-btn text-[13px] font-bold text-foreground"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Merken
            </button>
            <button onClick={() => setEditing(false)} className="text-[12px] font-bold text-muted-foreground">
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </div>
  );
}