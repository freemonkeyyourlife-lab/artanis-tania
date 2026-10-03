import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, X } from "lucide-react";

// Der Stift in God Mode: eine Notiz zu genau diesem Knopf, Feld oder Abschnitt.
// Sie liegt nur bei der Verwaltung und bleibt stehen, bis du sie erledigt hast.
export default function GodNoteEditor({ page, kind = "ELEMENT", label = "", tag = "", style, onClose }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!note.trim() || busy) return;
    setBusy(true);
    try {
      await base44.entities.DesignNote.create({ page, kind, label, tag, note: note.trim() });
      window.dispatchEvent(new Event("artanis:design-note"));
    } finally {
      setBusy(false);
      onClose();
    }
  };

  return (
    <div
      data-god-layer
      style={style}
      className="fixed z-[80] w-[330px] glass-strong rounded-2xl border-2 border-primary/50 p-4 shadow-2xl"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <p className="text-[12px] font-bold uppercase tracking-wider text-primary">
          {kind === "PAGE" ? "Notiz zu dieser Seite" : "Notiz zu diesem Element"}
        </p>
        <button
          onClick={onClose}
          className="w-6 h-6 rounded-full glass-btn flex items-center justify-center text-muted-foreground hover:text-foreground"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {label && (
        <p className="text-[13px] font-semibold text-foreground/90 mb-2 line-clamp-2">{`„${label}“`}</p>
      )}

      <textarea
        autoFocus
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={4}
        placeholder="Was soll hier anders werden?"
        className="w-full px-3 py-2 rounded-xl bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
      />

      <button
        onClick={save}
        disabled={!note.trim() || busy}
        className="mt-2 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full glass-btn glass-btn-accent text-[13px] font-bold text-gloss disabled:opacity-50"
      >
        {busy && <Loader2 className="w-4 h-4 animate-spin" />} Notiz speichern
      </button>
    </div>
  );
}