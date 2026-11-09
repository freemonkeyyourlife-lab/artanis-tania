import React, { useEffect, useState } from "react";
import { Loader2, Type, AlignLeft, Palette, RotateCcw, Save, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { FONTS } from "@/lib/appFont";
import { DEFAULT_THEME, applyTheme, loadActiveTheme, saveTheme, normalizeTheme } from "@/lib/appTheme";

// Vorgefertigte Akzent-Paletten — ein Klick genügt.
const SWATCHES = [
  { label: "Warm", h: 16, s: 65, l: 68 },
  { label: "Rose", h: 340, s: 75, l: 70 },
  { label: "Gold", h: 41, s: 85, l: 60 },
  { label: "Violett", h: 262, s: 70, l: 68 },
  { label: "Blau", h: 217, s: 80, l: 64 },
  { label: "Türkis", h: 168, s: 62, l: 56 },
  { label: "Grün", h: 142, s: 55, l: 52 },
  { label: "Crimson", h: 0, s: 78, l: 62 },
];

export default function DesignEditor({ open, onClose }) {
  const { toast } = useToast();
  const [theme, setTheme] = useState(DEFAULT_THEME);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    let alive = true;
    setLoading(true);
    loadActiveTheme().then((t) => {
      if (!alive) return;
      setTheme(normalizeTheme(t || DEFAULT_THEME));
      setLoading(false);
    });
    return () => { alive = false; };
  }, [open]);

  const preview = (patch) => {
    const next = normalizeTheme({ ...theme, ...patch });
    setTheme(next);
    applyTheme(next);
  };

  const reset = () => {
    setTheme(DEFAULT_THEME);
    applyTheme(DEFAULT_THEME);
  };

  const save = async () => {
    setSaving(true);
    try {
      await saveTheme(theme);
      toast({ title: "Design gespeichert", description: "Gilt ab sofort für die ganze Seite." });
      onClose();
    } catch (e) {
      toast({ variant: "destructive", title: "Speichern fehlgeschlagen", description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-3xl border border-border bg-card p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl text-foreground">Design-Editor</h2>
          <button onClick={onClose} className="rounded-full bg-elevated p-1.5 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">Schrift, Zeilenabstand und Akzentfarbe für die gesamte Seite. Speichern gilt für alle Besucher.</p>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : (
          <>
            {/* Schriftart */}
            <div className="mt-5">
              <h3 className="font-heading text-sm text-foreground flex items-center gap-1.5"><Type className="h-4 w-4 text-primary" /> Schriftart</h3>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {FONTS.map((f) => (
                  <button key={f.value} onClick={() => preview({ font: f.value })}
                    className={"rounded-xl border px-3 py-2 text-left transition-colors " + (theme.font === f.value ? "border-primary bg-primary/10" : "border-border bg-elevated hover:border-primary/50")}>
                    <span className="block text-sm text-foreground" style={{ fontFamily: `"${f.value}", sans-serif` }}>{f.label}</span>
                    <span className="block text-[11px] text-muted-foreground">{f.sample}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Zeilenabstand */}
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <h3 className="font-heading text-sm text-foreground flex items-center gap-1.5"><AlignLeft className="h-4 w-4 text-primary" /> Zeilenabstand</h3>
                <span className="text-xs text-muted-foreground tabular-nums">{theme.lineHeight.toFixed(2)}</span>
              </div>
              <input type="range" min={1.2} max={2.2} step={0.05} value={theme.lineHeight}
                onChange={(e) => preview({ lineHeight: parseFloat(e.target.value) })}
                className="mt-3 w-full accent-primary" />
            </div>

            {/* Akzentfarbe */}
            <div className="mt-6">
              <h3 className="font-heading text-sm text-foreground flex items-center gap-1.5"><Palette className="h-4 w-4 text-primary" /> Akzentfarbe</h3>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {SWATCHES.map((sw) => (
                  <button key={sw.label} onClick={() => preview({ accentH: sw.h, accentS: sw.s, accentL: sw.l })}
                    className={"rounded-xl border p-2 text-center transition-colors " + (theme.accentH === sw.h && theme.accentS === sw.s && theme.accentL === sw.l ? "border-primary" : "border-border hover:border-primary/50")}>
                    <span className="block h-7 w-full rounded-lg" style={{ background: `hsl(${sw.h} ${sw.s}% ${sw.l}%)` }} />
                    <span className="mt-1 block text-[11px] text-muted-foreground">{sw.label}</span>
                  </button>
                ))}
              </div>
              <div className="mt-3 space-y-2">
                <label className="text-[11px] text-muted-foreground">Helligkeit</label>
                <input type="range" min={35} max={85} step={1} value={theme.accentL}
                  onChange={(e) => preview({ accentL: parseInt(e.target.value, 10) })}
                  className="w-full accent-primary" />
              </div>
            </div>

            <div className="mt-7 flex items-center gap-2">
              <button onClick={reset} className="inline-flex items-center gap-1.5 rounded-full bg-elevated px-4 py-2 text-sm text-muted-foreground hover:text-foreground">
                <RotateCcw className="h-4 w-4" /> Zurücksetzen
              </button>
              <button onClick={save} disabled={saving}
                className="glass-btn glass-btn-accent inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} Für alle speichern
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}