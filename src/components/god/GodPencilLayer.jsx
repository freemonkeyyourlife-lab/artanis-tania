import React, { useEffect, useState } from "react";
import { Pencil } from "lucide-react";
import { isGodMode, subscribeGodMode } from "@/lib/godMode";
import { useFocus, useFocusTracker } from "@/lib/godFocus";
import GodNoteEditor from "@/components/god/GodNoteEditor";

// God Mode: über allem, was du antippst, schwebt ein Stift. Ein Klick darauf und
// du schreibst auf, was an diesem Knopf, Feld oder Abschnitt anders werden soll.
// Aus ist er, sobald der God Mode aus ist — normale Nutzer sehen nichts davon.
export default function GodPencilLayer() {
  const [on, setOn] = useState(isGodMode);
  const [editing, setEditing] = useState(null);
  const focus = useFocus();

  useFocusTracker(on);

  useEffect(() => subscribeGodMode(() => setOn(isGodMode())), []);

  if (!on) return null;

  const page = window.location.pathname;

  return (
    <>
      {focus && !editing && (
        <button
          data-god-layer
          onClick={() => setEditing({ label: focus.label, tag: focus.tag, rect: focus.rect })}
          title={`Notiz zu: ${focus.label}`}
          style={{
            top: Math.max(4, focus.rect.top - 12),
            left: Math.max(4, focus.rect.right - 14),
          }}
          className="fixed z-[75] w-7 h-7 rounded-full glass-btn glass-btn-accent flex items-center justify-center text-gloss shadow-lg"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}

      {editing && (
        <GodNoteEditor
          page={page}
          kind="ELEMENT"
          label={editing.label}
          tag={editing.tag}
          style={{
            top: Math.min(editing.rect.bottom + 8, window.innerHeight - 250),
            left: Math.min(Math.max(8, editing.rect.right - 330), window.innerWidth - 346),
          }}
          onClose={() => setEditing(null)}
        />
      )}
    </>
  );
}