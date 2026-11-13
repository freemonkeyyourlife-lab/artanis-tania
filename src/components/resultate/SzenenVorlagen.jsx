import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Bookmark, Save, Trash2, Loader2, FolderOpen, Upload } from "lucide-react";

// Szenen-Vorlagen-Bibliothek: die aktuelle Auswahl (Modus, Posen, Szenen,
// eigene Szene) als benanntes Paket sichern und später mit einem Klick wieder
// laden — statt jedes Mal alles neu einzustellen. Nur für die Besitzerin.

export default function SzenenVorlagen({ state, onApply }) {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.entities.SzenenVorlage.filter({}, { sort: "order", limit: 100 });
      setItems(res.items || []);
    } catch {
      /* noch keine Vorlagen */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    const n = (name || "").trim();
    if (!n) {
      toast({ title: "Name fehlt", description: "Gib der Vorlage einen Namen." });
      return;
    }
    try {
      await base44.entities.SzenenVorlage.create({
        name: n,
        mode: state.mode || "scenes",
        auswahl: state.sel || [],
        extra: state.extra || "",
      });
      setName("");
      toast({ title: "Vorlage gespeichert", description: `„${n}" steht jetzt zum Laden bereit.` });
      load();
    } catch (e) {
      toast({ variant: "destructive", title: "Speichern fehlgeschlagen", description: e?.message });
    }
  };

  const apply = (v) => {
    onApply?.({ mode: v.mode || "scenes", sel: v.auswahl || [], extra: v.extra || "" });
    setOpen(false);
    toast({ title: "Vorlage geladen", description: `„${v.name}" übernommen.` });
  };

  const remove = async (id) => {
    try {
      await base44.entities.SzenenVorlage.delete(id);
      setItems((xs) => xs.filter((x) => x.id !== id));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mt-3 rounded-xl border border-border bg-elevated/40 p-2.5">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-2 text-xs text-foreground">
        <span className="inline-flex items-center gap-1.5 font-heading">
          <Bookmark className="h-3.5 w-3.5 text-primary" /> Szenen-Vorlagen
        </span>
        <span className="text-muted-foreground">{loading ? "…" : `${items.length} gespeichert`}</span>
      </button>

      {open && (
        <div className="mt-2 space-y-2">
          <p className="text-[11px] text-muted-foreground">
            Aktuelle Auswahl sichern oder ein fertiges Szenen-Paket laden — Modus, Posen und Szenen kommen alle vorausgefüllt.
          </p>

          <div className="flex gap-1.5">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name für diese Vorlage"
              className="flex-1 rounded-full bg-background px-3 py-1.5 text-xs text-foreground"
            />
            <button
              onClick={save}
              className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
            >
              <Save className="h-3 w-3" /> Speichern
            </button>
          </div>

          {loading ? (
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" /> Lade …
            </div>
          ) : items.length ? (
            <div className="space-y-1">
              {items.map((v) => (
                <div key={v.id} className="flex items-center gap-1.5 rounded-lg bg-background/60 px-2 py-1.5">
                  <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="min-w-0 flex-1 truncate text-xs text-foreground">{v.name}</span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {v.mode === "poseSet" ? "Pose-Set" : "Szenen"} · {v.auswahl?.length || 0}
                  </span>
                  <button onClick={() => apply(v)} title="Vorlage laden"
                    className="inline-flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-[10px] font-semibold text-primary-foreground">
                    <Upload className="h-3 w-3" /> Laden
                  </button>
                  <button onClick={() => remove(v.id)} title="Vorlage löschen"
                    className="rounded-full bg-elevated p-1 text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground">Noch keine Vorlagen — speichere deine erste Auswahl.</p>
          )}
        </div>
      )}
    </div>
  );
}