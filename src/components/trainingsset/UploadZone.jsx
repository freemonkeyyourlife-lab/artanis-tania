import React, { useEffect, useRef, useState } from "react";
import JSZip from "jszip";
import { base44 } from "@/api/base44Client";
import { Upload, FolderUp, Loader2 } from "lucide-react";

// Eine offene Ablage: Bilder und Videos hochladen — einzelne Dateien, ZIPs
// oder ganze Ordner per Drag-and-Drop. Ordner werden rekursiv durchlaufen
// (Entry-API), jeder passende Treffer gespeichert. Die Dateien bleiben privat.
export default function UploadZone({ onUploaded }) {
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

  const isImage = (name) => /\.(png|jpe?g|webp|gif|bmp|avif)$/i.test(name || "");
  const isVideo = (name) => /\.(mp4|mov|webm|avi|mkv|m4v)$/i.test(name || "");
  const isZip = (name) => /\.zip$/i.test(name || "");
  const isMedia = (f) =>
    isImage(f.name) ||
    isVideo(f.name) ||
    isZip(f.name) ||
    (f.type && (f.type.startsWith("image") || f.type.startsWith("video") || f.type === "application/zip"));

  const uploadEntry = async (blob, type, name) => {
    const file = new File([blob], name || "datei", { type: type === "VIDEO" ? "video/mp4" : "image/jpeg" });
    const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
    onUploaded(file_uri, type, name);
  };

  const handleZip = async (file) => {
    const zip = await JSZip.loadAsync(file);
    const entries = Object.values(zip.files).filter((e) => !e.dir && isImage(e.name));
    for (const entry of entries) {
      const blob = await entry.async("blob");
      await uploadEntry(blob, "IMAGE", entry.name.split("/").pop());
    }
  };

  const uploadOne = async (file) => {
    if (isZip(file.name) || file.type === "application/zip") {
      await handleZip(file);
      return;
    }
    const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
    const type = isVideo(file.name) || file.type?.startsWith("video") ? "VIDEO" : "IMAGE";
    onUploaded(file_uri, type, file.name);
  };

  const handle = async (files) => {
    const list = Array.from(files || []).filter(isMedia);
    if (!list.length) return;
    setBusy(true);
    setTotal(list.length);
    setDone(0);
    for (const file of list) {
      try { await uploadOne(file); } catch { /* einzelne Datei überspringen */ }
      setDone((d) => d + 1);
    }
    setBusy(false);
  };

  // Ganze Ordner rekursiv durchlaufen — Drag-and-Drop via Entry-API.
  const readEntries = (reader) => new Promise((res) => reader.readEntries((e) => res(e), () => res([])));
  const collect = async (entry, acc) => {
    if (!entry) return;
    if (entry.isFile) {
      const file = await new Promise((res, rej) => entry.file(res, rej));
      acc.push(file);
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
      await handle(acc);
    } else {
      handle(e.dataTransfer.files);
    }
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
        {busy ? `Lade hoch … ${done}/${total || "?"}` : "Bilder, Videos, ZIP oder ganzen Ordner ablegen"}
      </span>
      <span className="text-xs text-muted-foreground">
        Per Drag & Drop reinziehen — auch ganze Ordner. Alles bleibt privat bei der App.
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
        onChange={(e) => { handle(e.target.files); e.target.value = ""; }}
      />
      <input
        ref={folderRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => { handle(e.target.files); e.target.value = ""; }}
      />
    </div>
  );
}