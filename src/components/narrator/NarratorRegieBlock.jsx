import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { labelCls, btnAccentCls } from "@/lib/narratorUi";

// Regie: wann, wie und was. Wie oft sie sich von selbst meldet, wie lange ihre
// Sprechblase stehen bleibt und ob sie überhaupt dazwischenredet.
export default function NarratorRegieBlock({ narrator, onSaved }) {
  const saved = narrator?.regie || {};
  const [form, setForm] = useState({
    autoSpeak: saved.autoSpeak !== false,
    showName: saved.showName !== false,
    firstAfter: Number(saved.firstAfter ?? 45),
    gap: Number(saved.gap ?? 150),
    bubble: Number(saved.bubble ?? 14),
  });
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const save = async () => {
    setBusy(true);
    setNote("");
    try {
      const rec = await base44.entities.Narrator.update(narrator.id, { regie: form });
      onSaved?.(rec);
      setNote("Gespeichert.");
    } finally {
      setBusy(false);
    }
  };

  const switchRow = (key, label, hint) => (
    <button
      onClick={() => set({ [key]: !form[key] })}
      className="w-full flex items-center justify-between gap-4 px-4 py-3 rounded-xl bg-background border border-border text-left"
    >
      <span>
        <span className="block text-[14px] font-bold text-foreground">{label}</span>
        <span className="block text-[12px] font-semibold text-muted-foreground">{hint}</span>
      </span>
      <span
        className={cn(
          "w-11 h-6 rounded-full flex items-center px-0.5 transition-colors flex-shrink-0",
          form[key] ? "bg-primary justify-end" : "bg-elevated justify-start"
        )}
      >
        <span className="w-5 h-5 rounded-full bg-background border border-border" />
      </span>
    </button>
  );

  return (
    <div>
      <div className="space-y-2">
        {switchRow("autoSpeak", "Sie meldet sich von selbst", "Zwischenrufe, damit niemand vor einer stummen Seite sitzt")}
        {switchRow("showName", "Name steht neben ihr", "Aus: nur das Bild unten im Eck")}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        <div>
          <label className={labelCls}>Erster Ruf · {form.firstAfter} s</label>
          <input
            type="range"
            min="5"
            max="300"
            step="5"
            value={form.firstAfter}
            onChange={(e) => set({ firstAfter: Number(e.target.value) })}
            className="w-full accent-primary"
          />
        </div>
        <div>
          <label className={labelCls}>Dann alle · {form.gap} s</label>
          <input
            type="range"
            min="15"
            max="900"
            step="15"
            value={form.gap}
            onChange={(e) => set({ gap: Number(e.target.value) })}
            className="w-full accent-primary"
          />
        </div>
        <div>
          <label className={labelCls}>Blase bleibt · {form.bubble} s</label>
          <input
            type="range"
            min="4"
            max="60"
            step="1"
            value={form.bubble}
            onChange={(e) => set({ bubble: Number(e.target.value) })}
            className="w-full accent-primary"
          />
        </div>
      </div>

      <p className="text-[13px] font-semibold text-muted-foreground mt-4">
        {form.autoSpeak
          ? `Sie sagt nach ${form.firstAfter} Sekunden den ersten Satz von selbst, danach alle ${form.gap} Sekunden. Ihre Sprechblase bleibt ${form.bubble} Sekunden stehen.`
          : `Sie sagt nichts von selbst. Nur wenn du sie antippst — dann bleibt ihre Blase ${form.bubble} Sekunden stehen.`}
      </p>

      <div className="flex flex-wrap items-center gap-2 mt-4">
        <button onClick={save} disabled={busy} className={btnAccentCls}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Speichern
        </button>
        {note && <span className="text-[12px] font-semibold text-muted-foreground">{note}</span>}
      </div>
    </div>
  );
}