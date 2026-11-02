import React, { useState } from "react";
import { Loader2, Mic, Image as ImageIcon, Film, Trash2, User, X, CheckCheck } from "lucide-react";
import { cn } from "@/lib/utils";

// Die Massen-Leiste: erscheint, sobald etwas ausgewählt ist. Eine Aktion trifft
// die ganze Auswahl auf einmal — nicht jeder Eintrag einzeln.
export default function GodTrainBulkBar({
  count,
  total,
  busy,
  progress,
  characters,
  onAssign,
  onTranscribe,
  onGenerateImage,
  onGenerateVideo,
  onDelete,
  onSelectAll,
  onClear,
}) {
  const [charId, setCharId] = useState("");
  if (count === 0) return null;

  return (
    <div className="sticky top-0 z-20 rounded-2xl glass-strong border-2 border-primary/40 p-2 flex flex-wrap items-center gap-2">
      <div className="flex items-center gap-2 px-2">
        <CheckCheck className="w-4 h-4 text-primary" />
        <span className="text-[12px] font-bold text-foreground">{count} ausgewählt</span>
        <button onClick={onClear} className="w-6 h-6 rounded-full glass-btn flex items-center justify-center text-muted-foreground hover:text-foreground">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <button onClick={onSelectAll} className="px-2.5 py-1 rounded-full glass-btn text-[11px] font-bold text-foreground">
        {count === total ? "Keine" : "Alle"}
      </button>

      <div className="flex items-center gap-1">
        <select
          value={charId}
          onChange={(e) => setCharId(e.target.value)}
          className="bg-elevated border border-border rounded-full px-2 py-1 text-[11px] text-foreground focus:outline-none max-w-[150px]"
        >
          <option value="">Charakter …</option>
          {characters.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
        <button
          onClick={() => { if (charId) { onAssign(charId); setCharId(""); } }}
          disabled={!charId || busy}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full glass-btn text-[11px] font-bold text-foreground disabled:opacity-50"
        >
          <User className="w-3 h-3" /> Zuordnen
        </button>
      </div>

      <button onClick={onTranscribe} disabled={busy} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full glass-btn text-[11px] font-bold text-foreground disabled:opacity-50">
        <Mic className="w-3 h-3" /> Transkribieren
      </button>
      <button onClick={onGenerateImage} disabled={busy} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full glass-btn text-[11px] font-bold text-foreground disabled:opacity-50">
        <ImageIcon className="w-3 h-3" /> Bild erzeugen
      </button>
      <button onClick={onGenerateVideo} disabled={busy} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full glass-btn text-[11px] font-bold text-foreground disabled:opacity-50">
        <Film className="w-3 h-3" /> Video erzeugen
      </button>
      <button onClick={onDelete} disabled={busy} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full glass-btn text-destructive disabled:opacity-50">
        <Trash2 className="w-3 h-3" /> Löschen
      </button>

      {busy && (
        <div className="flex items-center gap-2 ml-auto px-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
          <span className="text-[11px] font-bold text-muted-foreground">{progress}</span>
        </div>
      )}
    </div>
  );
}