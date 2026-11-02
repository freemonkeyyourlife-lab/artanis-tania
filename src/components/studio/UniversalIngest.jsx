import React, { useEffect, useRef, useState } from "react";
import { Upload, FolderUp, Link2, Loader2, Inbox } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { storeFile, storeLink, kindFromName } from "@/lib/quelleArchive";

// Ein Eingang für alles: Dateien, ganze Ordner, Links und Lesezeichen per
// Drag-and-Drop oder Eingabe — alles landet im Archiv (Quelle). Von dort
// holt man es sich später für jeden Zweck, statt hundert Upload-Wege zu pflegen.
export default function UniversalIngest({ onIngested }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [drag, setDrag] = useState(false);
  const [links, setLinks] = useState("");
  const fileRef = useRef(null);
  const folderRef = useRef(null);

  useEffect(() => {
    if (folderRef.current) {
      folderRef.current.setAttribute("webkitdirectory", "");
      folderRef.current.setAttribute("directory", "");
    }
  }, []);

  const ingestFiles = async (files, folderHint = "") => {
    const list = Array.from(files || []);
    if (!list.length) return;
    setBusy(true);
    setTotal(list.length);
    setDone(0);
    let ok = 0;
    for (const { file, folder } of list) {
      const folderName = folder || folderHint || topFolderOf(file);
      try {
        await storeFile(file, { folderName });
        ok += 1;
      } catch (e) {
        /* einzelne Datei überspringen */
      }
      setDone((d) => d + 1);
    }
    setBusy(false);
    return ok;
  };

  const ingestLinks = async () => {
    const urls = links
      .split(/[\s,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!urls.length) return 0;
    let ok = 0;
    for (const u of urls) {
      try { await storeLink(u); ok += 1; } catch { /* überspringen */ }
    }
    return ok;
  };

  const finish = async (filesOk, linksOk) => {
    const parts = [];
    if (filesOk) parts.push(`${filesOk} Datei(en)`);
    if (linksOk) parts.push(`${linksOk} Link(s)`);
    toast({
      title: "Ins Archiv übernommen",
      description: parts.length ? `${parts.join(" · ")} — ab jetzt für jede Nutzung verfügbar.` : "Nichts übernommen.",
    });
    setLinks("");
    onIngested?.();
  };

  const onGo = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const linksOk = await ingestLinks();
      setBusy(false);
      if (linksOk) finish(0, linksOk);
      else finish(0, 0);
    } catch (e) {
      setBusy(false);
      toast({ variant: "destructive", title: "Fehler", description: e?.message || "Abgebrochen." });
    }
  };

  const readEntries = (reader) => new Promise((res) => reader.readEntries((e) => res(e), () => res([])));
  const collect = async (entry, acc) => {
    if (!entry) return;
    if (entry.isFile) {
      const file = await new Promise((res, rej) => entry.file(res, rej));
      acc.push({ file, folder: topFolderOfPath(entry.fullPath) });
    } else if (entry.isDirectory) {
      const reader = entry.createReader();
      let batch = await readEntries(reader);
      while (batch.length > 0) {
        for (const c of batch) await collect(c, acc);
        batch = await readEntries(reader);
      }
    }
  };

  const onDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDrag(false);
    if (busy) return;
    const items = Array.from(e.dataTransfer.items || []);
    const entries = items.map((it) => it.webkitGetAsEntry && it.webkitGetAsEntry()).filter(Boolean);
    if (entries.length) {
      const acc = [];
      for (const en of entries) await collect(en, acc);
      if (acc.length) { const ok = await ingestFiles(acc.map((a) => ({ file: a.file, folder: a.folder }))); finish(ok || 0, 0); return; }
    }
    const list = Array.from(e.dataTransfer.files || []).map((file) => ({ file }));
    if (list.length) { const ok = await ingestFiles(list); finish(ok || 0, 0); }
  };

  return (
    <div
      onDrop={onDrop}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      className={`rounded-2xl border-2 border-dashed p-5 text-center transition-colors ${drag ? "border-primary bg-primary/10" : "border-border bg-elevated"}`}
    >
      <div className="flex flex-col items-center gap-2">
        {busy ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <Inbox className="h-6 w-6 text-primary" />}
        <span className="font-heading text-sm text-foreground">
          {busy ? `Archiviere … ${done}/${total || "?"}` : "Dateien, Ordner, Links oder Lesezeichen ablegen"}
        </span>
        <span className="text-xs text-muted-foreground">
          Alles landet im Archiv (stored privately) — später für jede Nutzung verfügbar.
        </span>
        <div className="mt-2 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="glass-btn glass-btn-accent inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs"
          >
            <Upload className="w-3.5 h-3.5" /> Dateien
          </button>
          <button
            type="button"
            onClick={() => folderRef.current?.click()}
            className="glass-btn inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs"
          >
            <FolderUp className="w-3.5 h-3.5" /> Ordner
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          multiple
          hidden
          onChange={(e) => { const list = Array.from(e.target.files || []).map((file) => ({ file })); if (list.length) ingestFiles(list).then((ok) => finish(ok || 0, 0)); e.target.value = ""; }}
        />
        <input
          ref={folderRef}
          type="file"
          multiple
          hidden
          onChange={(e) => { const list = Array.from(e.target.files || []).map((file) => ({ file, folder: topFolderOf(file) })); if (list.length) ingestFiles(list).then((ok) => finish(ok || 0, 0)); e.target.value = ""; }}
        />
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <div className="flex items-center gap-2 text-left">
          <Link2 className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs text-muted-foreground">Links / Lesezeichen — mehrere zeilenweise</span>
        </div>
        <textarea
          value={links}
          onChange={(e) => setLinks(e.target.value)}
          placeholder="https://…  oder Lesezeichen-Adresse, eine pro Zeile"
          rows={3}
          className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground"
        />
        <button
          type="button"
          onClick={onGo}
          disabled={busy || !links.trim()}
          className="glass-btn glass-btn-accent self-end rounded-full px-4 py-1.5 text-xs disabled:opacity-50"
        >
          Links ins Archiv
        </button>
      </div>
    </div>
  );
}

// Oberster Ordner aus webkitRelativePath (z. B. "Tania/Bild1.jpg" → "Tania").
function topFolderOf(file) {
  const p = file.webkitRelativePath || file.name || "";
  return topFolderOfPath(p);
}
function topFolderOfPath(fullPath) {
  const parts = (fullPath || "").split(/[\\/]/).filter(Boolean);
  return parts.length > 1 ? parts[0] : "";
}