import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { MessageSquarePlus, Trash2, X } from "lucide-react";
import { isGodMode, subscribeGodMode } from "@/lib/godMode";
import GodNoteEditor from "@/components/god/GodNoteEditor";

// God Mode: unten rechts sammeln sich deine Notizen. Eine für die ganze Seite —
// und die Liste, was du dir auf dieser Seite schon aufgeschrieben hast.
export default function GodNotesBar() {
  const [on, setOn] = useState(isGodMode);
  const [open, setOpen] = useState(false);
  const [writing, setWriting] = useState(false);
  const [notes, setNotes] = useState([]);
  const page = window.location.pathname;

  useEffect(() => subscribeGodMode(() => setOn(isGodMode())), []);

  const load = () =>
    base44.entities.DesignNote.filter({ page }, { sort: "-created_date", limit: 50 })
      .then((res) => setNotes(res.items))
      .catch(() => setNotes([]));

  useEffect(() => {
    if (!on) return;
    load();
    const reload = () => load();
    window.addEventListener("artanis:design-note", reload);
    return () => window.removeEventListener("artanis:design-note", reload);
  }, [on, page]);

  if (!on) return null;

  const remove = async (id) => {
    await base44.entities.DesignNote.delete(id);
    load();
  };

  return (
    <>
      <div className="fixed right-4 bottom-24 lg:bottom-6 z-[60] flex items-center gap-1.5 glass-strong rounded-full p-1.5">
        <button
          onClick={() => setWriting(true)}
          title="Notiz zu dieser Seite"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-btn text-[13px] font-bold text-foreground hover:text-primary transition-colors"
        >
          <MessageSquarePlus className="w-4 h-4" /> Seite
        </button>
        <button
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-btn text-[13px] font-bold text-foreground hover:text-primary transition-colors"
        >
          Notizen
          <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[11px] font-bold flex items-center justify-center">
            {notes.length}
          </span>
        </button>
      </div>

      {writing && (
        <GodNoteEditor
          page={page}
          kind="PAGE"
          label={page}
          style={{ top: window.innerHeight - 300, right: 16 }}
          onClose={() => setWriting(false)}
        />
      )}

      {open && (
        <div className="fixed right-4 bottom-40 lg:bottom-20 z-[70] w-[340px] max-h-[60vh] overflow-y-auto glass-strong rounded-2xl border-2 border-border p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">
              Deine Notizen · {page}
            </p>
            <button
              onClick={() => setOpen(false)}
              className="w-6 h-6 rounded-full glass-btn flex items-center justify-center text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {notes.length === 0 ? (
            <p className="text-[13px] font-semibold text-muted-foreground">
              Noch nichts notiert. Fahr über ein Element und tippe auf den Stift.
            </p>
          ) : (
            <div className="space-y-2">
              {notes.map((n) => (
                <div key={n.id} className="rounded-xl bg-elevated border border-border p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
                      {n.kind === "PAGE" ? "Seite" : n.label || "Element"}
                    </p>
                    <button
                      onClick={() => remove(n.id)}
                      title="Notiz löschen"
                      className="text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[13px] font-semibold text-foreground mt-1 whitespace-pre-wrap">{n.note}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}