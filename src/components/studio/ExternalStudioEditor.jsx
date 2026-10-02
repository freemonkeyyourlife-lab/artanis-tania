import React, { useState } from "react";
import { ArrowUp, ArrowDown, Eye, EyeOff, Save, RotateCcw, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_POSITIONS, defaultStudioLayout } from "@/lib/studioLayout";

// Der Struktureditor: Bereiche sortieren, umbenennen, ausblenden, Menü-Position
// und Startbereich wählen. Erst „Speichern" macht es dauerhaft.
export default function ExternalStudioEditor({ value, onSave, onCancel }) {
  const [draft, setDraft] = useState(value);
  const [busy, setBusy] = useState(false);

  const setSections = (sections) => setDraft((d) => ({ ...d, sections }));
  const move = (i, dir) => {
    const next = [...draft.sections];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setSections(next);
  };
  const patch = (i, data) => setSections(draft.sections.map((s, k) => (k === i ? { ...s, ...data } : s)));
  const visible = draft.sections.filter((s) => !s.hidden);

  const save = async () => {
    setBusy(true);
    await onSave(draft);
    setBusy(false);
  };

  return (
    <div className="rounded-2xl border-2 border-yellow-400 bg-card p-5 mb-5 space-y-5">
      <div>
        <p className="font-display text-lg text-foreground">Arbeitsfläche anordnen</p>
        <p className="text-[13px] font-semibold text-muted-foreground">Reihenfolge, Namen und Sichtbarkeit der Bereiche — und wo das Menü sitzt.</p>
      </div>

      <div className="space-y-2">
        {draft.sections.map((s, i) => (
          <div key={s.id} className={cn("flex items-center gap-2 p-2 rounded-xl border border-border bg-elevated", s.hidden && "opacity-50")}>
            <span className="w-7 text-center text-sm font-bold text-muted-foreground">{i + 1}</span>
            <input
              value={s.label}
              onChange={(e) => patch(i, { label: e.target.value })}
              className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm font-semibold text-foreground"
            />
            <button onClick={() => move(i, -1)} disabled={i === 0} className="w-8 h-8 rounded-full glass-btn flex items-center justify-center disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
            <button onClick={() => move(i, 1)} disabled={i === draft.sections.length - 1} className="w-8 h-8 rounded-full glass-btn flex items-center justify-center disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
            <button
              onClick={() => patch(i, { hidden: !s.hidden })}
              disabled={!s.hidden && visible.length === 1}
              title={s.hidden ? "Einblenden" : "Ausblenden"}
              className="w-8 h-8 rounded-full glass-btn flex items-center justify-center disabled:opacity-30"
            >
              {s.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Menü-Position</p>
          <div className="flex flex-wrap gap-2">
            {NAV_POSITIONS.map((p) => (
              <button
                key={p.id}
                onClick={() => setDraft((d) => ({ ...d, nav: p.id }))}
                className={cn("px-4 py-2 rounded-full text-[13px] font-bold", draft.nav === p.id ? "glass-btn glass-btn-accent" : "glass-btn text-muted-foreground")}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Startet mit</p>
          <select
            value={visible.some((s) => s.id === draft.start) ? draft.start : visible[0]?.id}
            onChange={(e) => setDraft((d) => ({ ...d, start: e.target.value }))}
            className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground"
          >
            {visible.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={save} disabled={busy} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn glass-btn-accent text-sm font-bold disabled:opacity-50">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Speichern
        </button>
        <button onClick={() => setDraft(defaultStudioLayout())} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-sm font-bold text-muted-foreground">
          <RotateCcw className="w-4 h-4" /> Standard
        </button>
        <button onClick={onCancel} className="px-5 py-2.5 rounded-full glass-btn text-sm font-bold text-muted-foreground">Abbrechen</button>
      </div>
    </div>
  );
}