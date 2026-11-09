import React, { useEffect, useState, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Image } from "@/components/ui/image";
import { Loader2, X, HardDrive, Folder, File, ChevronLeft, Search, Check, Download, RefreshCw } from "lucide-react";

// Browser fuer den verbundenen Google Drive: Ordner durchsuchen, Medien auswaehlen
// und per Klick in die Sammel-Galerie uebernehmen (als Trainings-Quelle).
// Nur im privaten Studio (admin). Oeffnet Drive ueber den Shared-Connector.

const isVideo = (mt) => (mt || "").startsWith("video/");
const isAudio = (mt) => (mt || "").startsWith("audio/");
const isImage = (mt) => (mt || "").startsWith("image/");
const isMedia = (f) => !f.isFolder && (isImage(f.mimeType) || isVideo(f.mimeType) || isAudio(f.mimeType));

export default function DriveBrowser({ open, onClose, onImported }) {
  const { toast } = useToast();
  const [path, setPath] = useState([{ id: "root", name: "Mein Drive" }]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState({});
  const [busy, setBusy] = useState(false);
  const [nextPage, setNextPage] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const current = path[path.length - 1];

  const load = useCallback(async (folderId, query, pageToken) => {
    setLoading(!pageToken);
    setLoadingMore(!!pageToken);
    try {
      const res = await base44.functions.invoke("gdriveList", { folderId, q: query, pageToken });
      const data = res?.data || res;
      if (pageToken) {
        setItems((xs) => [...xs, ...(data.items || [])]);
      } else {
        setItems(data.items || []);
      }
      setNextPage(data.nextPageToken || null);
    } catch (e) {
      toast({ variant: "destructive", title: "Drive nicht abrufbar", description: e?.message || "Verbindung prüfen." });
      setItems([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!open) return;
    setPath([{ id: "root", name: "Mein Drive" }]);
    setQ("");
    setSelected({});
    load("root", "");
  }, [open, load]);

  const openFolder = (f) => {
    setPath((p) => [...p, { id: f.id, name: f.name }]);
    setSelected({});
    load(f.id, "");
  };

  const goUp = () => {
    if (path.length <= 1) return;
    const next = path.slice(0, -1);
    setPath(next);
    setSelected({});
    load(next[next.length - 1].id, "");
  };

  const jumpTo = (idx) => {
    const next = path.slice(0, idx + 1);
    setPath(next);
    setSelected({});
    load(next[next.length - 1].id, q);
  };

  const toggle = (f) => {
    if (!isMedia(f)) return;
    setSelected((s) => ({ ...s, [f.id]: s[f.id] ? undefined : f }));
  };

  const runSearch = () => load(current.id, q);

  const pickAll = () => {
    const media = items.filter(isMedia);
    const next = {};
    media.forEach((f) => { next[f.id] = f; });
    setSelected(next);
  };

  const selectedList = Object.values(selected).filter(Boolean);

  const importSelected = async () => {
    if (!selectedList.length || busy) return;
    setBusy(true);
    try {
      const res = await base44.functions.invoke("gdriveImport", {
        files: selectedList.map((f) => ({ id: f.id, name: f.name })),
      });
      const data = res?.data || res;
      const ok = (data.imported || []).filter((x) => x.url);
      const failed = (data.imported || []).filter((x) => x.error);
      if (ok.length) {
        await base44.entities.ImageArchive.bulkCreate(
          ok.map((x) => ({
            name: x.name,
            url: x.url,
            kind: "ALLGEMEIN",
            note: "Aus Google Drive",
            source: "UPLOAD",
          }))
        );
      }
      toast({
        title: ok.length ? "Aus Drive übernommen" : "Nichts übernommen",
        description: `${ok.length} Datei(en) in der Galerie.` + (failed.length ? ` ${failed.length} übersprungen.` : ""),
        variant: ok.length ? "default" : "destructive",
      });
      if (ok.length) {
        setSelected({});
        onImported?.();
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Import fehlgeschlagen", description: e?.message });
    } finally {
      setBusy(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="flex h-[80vh] w-full max-w-3xl flex-col rounded-3xl border border-border bg-card" onClick={(e) => e.stopPropagation()}>
        {/* Kopf */}
        <div className="flex items-center gap-2 border-b border-border p-4">
          <HardDrive className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg text-foreground">Google Drive durchsuchen</h2>
          <span className="text-xs text-muted-foreground hidden sm:inline">Wähle Medien und übernimm sie als Trainings-Quelle.</span>
          <button onClick={onClose} className="ml-auto rounded-full bg-elevated p-1.5 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>

        {/* Pfad + Suche */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-2">
          <button onClick={goUp} disabled={path.length <= 1} className="rounded-full bg-elevated px-2 py-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 inline-flex items-center gap-1"><ChevronLeft className="h-3.5 w-3.5" /> Hoch</button>
          <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
            {path.map((p, i) => (
              <span key={p.id} className="inline-flex items-center gap-1">
                {i > 0 && <span className="text-muted-foreground/50">/</span>}
                <button onClick={() => jumpTo(i)} className="hover:text-foreground">{p.name}</button>
              </span>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && runSearch()}
              placeholder="Suchen …" className="w-36 rounded-full bg-elevated px-3 py-1 text-xs text-foreground" />
            <button onClick={runSearch} className="rounded-full bg-elevated px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1"><Search className="h-3.5 w-3.5" /></button>
            <button onClick={pickAll} className="rounded-full bg-elevated px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground">Alle Medien</button>
          </div>
        </div>

        {/* Liste */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading ? (
            <div className="flex h-full items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-center">
              <HardDrive className="h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-foreground font-heading">Keine Dateien hier</p>
              <p className="text-xs text-muted-foreground">Öffne einen Ordner oder suche nach Namen.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {items.map((f) => {
                const sel = !!selected[f.id];
                return (
                  <button key={f.id} onClick={() => (f.isFolder ? openFolder(f) : toggle(f))}
                    className={"group relative overflow-hidden rounded-xl border bg-elevated text-left transition-colors " + (sel ? "border-primary" : "border-border hover:border-primary/50")}>
                    <div className="aspect-square w-full overflow-hidden bg-background flex items-center justify-center">
                      {f.isFolder ? (
                        <Folder className="h-8 w-8 text-primary" />
                      ) : f.thumbnail && isImage(f.mimeType) ? (
                        <Image src={f.thumbnail} fittingType="fill" className="h-full w-full" />
                      ) : isVideo(f.mimeType) ? (
                        <File className="h-8 w-8 text-badge-ai" />
                      ) : isAudio(f.mimeType) ? (
                        <File className="h-8 w-8 text-secondary" />
                      ) : (
                        <File className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <div className="px-2 py-1.5">
                      <p className="truncate text-[11px] text-foreground">{f.name}</p>
                      <p className="text-[10px] text-muted-foreground">{f.isFolder ? "Ordner" : f.mimeType?.split("/")[1] || "Datei"}</p>
                    </div>
                    {sel && (
                      <span className="absolute right-1.5 top-1.5 rounded-full bg-primary p-1 text-primary-foreground"><Check className="h-3 w-3" /></span>
                    )}
                    {f.isFolder && (
                      <span className="absolute right-1.5 top-1.5 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white">öffnen</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
          {nextPage && (
            <div className="mt-3 flex justify-center">
              <button onClick={() => load(current.id, q, nextPage)} disabled={loadingMore}
                className="rounded-full bg-elevated px-4 py-2 text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                {loadingMore ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} Mehr laden
              </button>
            </div>
          )}
        </div>

        {/* Fuß */}
        <div className="flex items-center gap-3 border-t border-border p-3">
          <span className="text-xs text-muted-foreground">{selectedList.length} ausgewählt</span>
          <button onClick={onClose} className="ml-auto rounded-full bg-elevated px-4 py-2 text-sm text-muted-foreground hover:text-foreground">Abbrechen</button>
          <button onClick={importSelected} disabled={busy || !selectedList.length}
            className="glass-btn glass-btn-accent inline-flex items-center gap-1.5 rounded-full px-5 py-2 text-sm disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} In Galerie übernehmen
          </button>
        </div>
      </div>
    </div>
  );
}