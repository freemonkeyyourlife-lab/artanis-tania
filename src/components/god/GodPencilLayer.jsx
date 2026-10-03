import React, { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";
import { isGodMode, subscribeGodMode } from "@/lib/godMode";
import GodNoteEditor from "@/components/god/GodNoteEditor";

// God Mode: über allem, was du antippst, schwebt ein Stift. Ein Klick darauf und
// du schreibst auf, was an diesem Knopf, Feld oder Abschnitt anders werden soll.
// Aus ist er, sobald der God Mode aus ist — normale Nutzer sehen nichts davon.
const PICKABLE =
  "button, a, input, textarea, select, label, [role='button'], img, h1, h2, h3, h4, li, p";

function labelOf(el) {
  const text = (el.innerText || el.value || "").replace(/\s+/g, " ").trim();
  if (text) return text.slice(0, 70);
  const hint =
    el.getAttribute?.("placeholder") ||
    el.getAttribute?.("aria-label") ||
    el.getAttribute?.("alt") ||
    el.getAttribute?.("title");
  return (hint || el.tagName.toLowerCase()).slice(0, 70);
}

export default function GodPencilLayer() {
  const [on, setOn] = useState(isGodMode);
  const [target, setTarget] = useState(null);
  const [editing, setEditing] = useState(null);
  const editingRef = useRef(false);

  useEffect(() => subscribeGodMode(() => setOn(isGodMode())), []);
  useEffect(() => {
    editingRef.current = !!editing;
  }, [editing]);

  useEffect(() => {
    if (!on) {
      setTarget(null);
      return;
    }
    const onMove = (event) => {
      if (editingRef.current) return;
      const under = document.elementFromPoint(event.clientX, event.clientY);
      if (!under || under.closest("[data-god-layer]")) return;
      const el = under.closest(PICKABLE);
      if (!el || el === document.body || el === document.documentElement) {
        setTarget(null);
        return;
      }
      const rect = el.getBoundingClientRect();
      if (rect.width < 14 || rect.height < 14) {
        setTarget(null);
        return;
      }
      setTarget({ label: labelOf(el), tag: el.tagName.toLowerCase(), rect });
    };
    const clear = () => setTarget(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("scroll", clear, true);
    window.addEventListener("resize", clear);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", clear, true);
      window.removeEventListener("resize", clear);
    };
  }, [on]);

  if (!on) return null;

  const page = window.location.pathname;

  return (
    <>
      {target && !editing && (
        <button
          data-god-layer
          onClick={() => setEditing({ label: target.label, tag: target.tag, rect: target.rect })}
          title={`Notiz zu: ${target.label}`}
          style={{
            top: Math.max(4, target.rect.top - 12),
            left: Math.max(4, target.rect.right - 14),
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