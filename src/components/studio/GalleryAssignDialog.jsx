import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, X, Images, Check, Search } from "lucide-react";

// Modal: wählt Dateien aus der Sammel-Galerie und weist sie einem
// Trainings-Satz zu (anhängen an sourceMedia). Nur im privaten Studio.

const isVideo = (u) => /\.(mp4|mov|webm|avi|mkv|m4v|ogv)$/i.test((u || "").split(/[?#]/)[0]);
const isAudio = (u) => /\.(mp3|wav|ogg|m4a|flac|aac|opus)$/i.test((u || "").split(/[?#]/)[0]);
const mediaType = (u) => (isVideo(u) ? "video" : isAudio(u) ? "audio" : "image");

export default function GalleryAssignDialog({ open, set, onClose, onDone }) {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.entities.ImageArchive.filter({}, { sort: "-created_date", limit: 200 });
      setItems(res.items || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setSelected([]);
      setFilter("");
      load();
    }
  }, [open]);

  const filtered = items.filter(
    (it) => !filter || `${it.name || ""} ${it.note || ""} ${(it.tags || []).join(" ")}`.toLowerCase().includes(filter.toLowerCase())
  );

  const toggle = (id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const assign = async () => {
    if (!set || !selected.length || busy) return;
    setBusy(true);
    try {
      const chosen = items.filter((it) => selected.includes(it.id)).map((it) => it.url);
      const next = Array.isArray(set.sourceMedia) ? [...set.sourceMedia, ...chosen] : chosen;
      await base44.entities.TrainingSet.update(set.id, { sourceMedia: next });
      toast({ title: "Zugewiesen", description: `${chosen.length} Datei(en) zu „${set.personName || set.name || "Satz"}".` });
      onDone?.();
      onClose?.();
    } catch (e) {
      toast({ variant: "destructive", title: "Fehlgeschlagen", description: e?.message });
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="flex h-[78vh] w-full max-w-3xl flex-col rounded-3xl border border-border bg-card" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-border p-4">
          <Images className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg text-foreground">Aus Galerie zuweisen</h2>
          <span className="truncate text-xs text-muted-foreground">→ {set?.personName || set?.name || ""}</span>
          <button onClick={onClose} className="ml-auto rounded-full bg-elevated p-1.5 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filtern nach Name, Notiz, Tag …" className="flex-1 rounded-full bg-elevated px-3 py-1.5 text-sm text-foreground" />
          <span className="text-xs text-muted-foreground">{selected.length} gewählt</span>
        </div>
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : filtered.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">Galerie leer — lade Medien in der Sammel-Galerie.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {filtered.map((it) => {
                const sel = selected.includes(it.id);
                return (
                  <button key={it.id} onClick={() => toggle(it.id)} title={it.name}
                    className={"relative aspect-[3/4] overflow-hidden rounded-xl border-2 bg-background " + (sel ? "border-primary" : "border-border hover:border-primary/50")}>
                    {mediaType(it.url) === "video" ? (
                      <video src={it.url} className="h-full w-full object-cover" muted />
                    ) : mediaType(it.url) === "audio" ? (
                      <div className="flex h-full w-full flex-col items-center justify-center gap-1 p-1 text-center">
                        <span className="text-2xl">🎙️</span>
                        <span className="text-[10px] text-muted-foreground">Audio</span>
                      </div>
                    ) : (
                      <Image src={it.url} fittingType="fill" className="h-full w-full" />
                    )}
                    {sel && <span className="absolute right-1 top-1 rounded-full bg-primary p-1 text-primary-foreground"><Check className="h-3 w-3" /></span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 border-t border-border p-3">
          <span className="text-xs text-muted-foreground">{selected.length} ausgewählt</span>
          <button onClick={onClose} className="ml-auto rounded-full bg-elevated px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Abbrechen</button>
          <button onClick={assign} disabled={busy || !selected.length}
            className="glass-btn glass-btn-accent inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Zuweisen
          </button>
        </div>
      </div>
    </div>
  );
}