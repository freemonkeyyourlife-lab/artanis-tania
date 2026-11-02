import React, { useEffect, useRef, useState } from "react";
import JSZip from "jszip";
import { base44 } from "@/api/base44Client";
import { Upload, FolderUp, Loader2 } from "lucide-react";
import { cropToPortrait, signatureOf } from "@/lib/trainImage";

const isImage = (name) => /\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(name || "");
const isVideo = (name) => /\.(mp4|mov|webm|avi|mkv|m4v)$/i.test(name || "");
const isZip = (name) => /\.zip$/i.test(name || "");
const isMedia = (f) =>
  isImage(f.name) ||
  isVideo(f.name) ||
  isZip(f.name) ||
  (f.type && (f.type.startsWith("image") || f.type.startsWith("video") || f.type === "application/zip"));

// Offene Ablage: Bilder, Videos, ZIPs oder ganze Ordner per Drag-and-Drop.
// Bilder werden VOR dem Upload auf 3:4-Porträt zugeschnitten und entdoppelt
// (perceptueller Hash). Der Ordnername wird als Personenname mitgegeben.
// Am Ende geht ein Batch an die Pipeline — direkt in die Sets und aufgefüllt.
export default function UploadZone({ onBatch }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef(null);
  const folderRef = useRef(null);

  useEffect(() => {
    if (folderRef.current) {
      folderRef.current.setAttribute("webkitdirectory", "");
      folderRef.current.setAttribute("directory", "");
    }
  }, []);

  const addImage = async (file, name, out, sigs) => {
    let proc = file;
    try { proc = await cropToPortrait(file); } catch { /* ohne Zuschnitt weiter */ }
    let sig = "";
    try { sig = await signatureOf(proc); } catch { /* ohne Hash weiter */ }
    if (sig && sigs.has(sig)) return; // entdoppelt
    if (sig) sigs.add(sig);
    const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file: proc });
    out.push({ uri: file_uri, type: "IMAGE", name });
  };

  const processFile = async (file, name, out, sigs) => {
    if (isZip(file.name) || file.type === "application/zip") {
      const zip = await JSZip.loadAsync(file);
      const entries = Object.values(zip.files).filter((e) => !e.dir && isImage(e.name));
      for (const entry of entries) {
        const blob = await entry.async("blob");
        const f = new File([blob], entry.name.split("/").pop(), { type: "image/jpeg" });
        await addImage(f, entry.name, out, sigs);
      }
      return;
    }
    if (isVideo(file.name) || file.type?.startsWith("video")) {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      out.push({ uri: file_uri, type: "VIDEO", name });
      return;
    }
    if (isImage(file.name) || file.type?.startsWith("image")) {
      await addImage(file, name, out, sigs);
    }
  };

  const run = async (files) => {
    const out = [];
    const sigs = new Set();
    setBusy(true);
    setTotal(files.length);
    setDone(0);
    for (const { file, path } of files) {
      const name = path || file.webkitRelativePath || file.name;
      try { await processFile(file, name, out, sigs); } catch { /* einzelne Datei überspringen */ }
      setDone((d) => d + 1);
    }
    setBusy(false);
    if (out.length) onBatch?.(out);
  };

  const readEntries = (reader) => new Promise((res) => reader.readEntries((e) => res(e), () => res([])));
  const collect = async (entry, acc) => {
    if (!entry) return;
    if (entry.isFile) {
      const file = await new Promise((res, rej) => entry.file(res, rej));
      acc.push({ file, path: entry.fullPath || file.name });
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
    const items = Array.from(e.dataTransfer.items || []);
    const entries = items.map((it) => it.webkitGetAsEntry && it.webkitGetAsEntry()).filter(Boolean);
    if (entries.length) {
      const acc = [];
      for (const en of entries) await collect(en, acc);
      const list = acc.filter((a) => isMedia(a.file));
      if (list.length) { await run(list); return; }
    }
    const list = Array.from(e.dataTransfer.files || []).filter(isMedia).map((file) => ({ file }));
    if (list.length) await run(list);
  };

  return (
    <div
      onDrop={onDrop}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      className={`glass-btn flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors ${drag ? "border-primary bg-primary/10" : "border-border"}`}
    >
      {busy ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : (
        <Upload className="h-6 w-6 text-primary" />
      )}
      <span className="font-heading text-foreground">
        {busy ? `Verarbeite … ${done}/${total || "?"}` : "Bilder, Videos, ZIP oder ganzen Ordner ablegen"}
      </span>
      <span className="text-xs text-muted-foreground">
        Bilder werden auf 3:4 zugeschnitten, entdoppelt und direkt einsortiert (stored privately).
      </span>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="glass-btn glass-btn-accent rounded-full px-3 py-1.5 text-xs"
        >
          Dateien
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
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => { const list = Array.from(e.target.files || []).filter(isMedia).map((file) => ({ file })); if (list.length) run(list); e.target.value = ""; }}
      />
      <input
        ref={folderRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => { const list = Array.from(e.target.files || []).filter(isMedia).map((file) => ({ file })); if (list.length) run(list); e.target.value = ""; }}
      />
    </div>
  );
}