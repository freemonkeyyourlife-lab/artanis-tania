import React, { useRef, useState } from "react";
import { Loader2, FolderUp, Upload } from "lucide-react";
import { cn } from "@/lib/utils";

// Massen-Eingang: hier ziehst du einen ganzen Ordner rein oder wählst Dateien —
// alles auf einen Schlag. Der Browser durchsucht auch Unterordner, sodass du
// nicht jede Datei einzeln anklicken musst.
export default function GodTrainDropZone({ onFiles, busy }) {
  const [drag, setDrag] = useState(false);
  const fileRef = useRef(null);
  const folderRef = useRef(null);

  const handle = (list) => {
    const files = Array.from(list || []).filter((f) => f && f.size);
    if (files.length) onFiles(files);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        if (busy) return;
        // Ordner werden über DataTransferItemList rekursiv geholt —
        // einfache File-Listen (kein Ordner) fallen direkt durch.
        const items = e.dataTransfer.items;
        if (items && items.length && items[0].webkitGetAsEntry) {
          const collected = [];
          let pending = 0;
          const walk = (entry, prefix = "") => {
            pending++;
            if (entry.isFile) {
              entry.file((f) => {
                collected.push(prefix ? new File([f], `${prefix}/${f.name}`, { type: f.type }) : f);
                if (--pending === 0) handle(collected);
              });
            } else if (entry.isDirectory) {
              const reader = entry.createReader();
              const readAll = () => reader.readEntries((ents) => {
                if (!ents.length) { if (--pending === 0) handle(collected); return; }
                ents.forEach((en) => walk(en, `${prefix}${prefix ? "/" : ""}${entry.name}`));
                readAll();
              });
              readAll();
            } else {
              if (--pending === 0) handle(collected);
            }
          };
          const top = [];
          for (let i = 0; i < items.length; i++) {
            const entry = items[i].webkitGetAsEntry();
            if (entry) top.push(entry);
          }
          if (!top.length) handle(e.dataTransfer.files);
          else top.forEach((en) => walk(en));
        } else {
          handle(e.dataTransfer.files);
        }
      }}
      className={cn(
        "rounded-2xl border-2 border-dashed p-4 flex flex-col items-center justify-center gap-2 transition-colors text-center",
        drag ? "border-primary bg-primary/10" : "border-border bg-background/40 hover:border-primary/40"
      )}
    >
      {busy ? (
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
      ) : (
        <Upload className="w-5 h-5 text-primary" />
      )}
      <p className="text-[12px] font-bold text-foreground">
        {busy ? "lädt hoch …" : "Dateien oder ganzen Ordner hierher ziehen"}
      </p>
      <p className="text-[10px] text-muted-foreground">Bilder · Video · Audio · Text — inkl. Unterordner</p>
      <div className="flex gap-2 mt-1">
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-btn text-[11px] font-bold text-foreground disabled:opacity-50"
        >
          <Upload className="w-3.5 h-3.5" /> Dateien
        </button>
        <button
          onClick={() => folderRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-btn glass-btn-accent text-[11px] font-bold text-gloss disabled:opacity-50"
        >
          <FolderUp className="w-3.5 h-3.5" /> Ordner durchsuchen
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => { handle(e.target.files); if (fileRef.current) fileRef.current.value = ""; }}
      />
      <input
        ref={folderRef}
        type="file"
        multiple
        // webkitdirectory durchsucht einen ganzen Ordner inkl. Unterordner.
        webkitdirectory=""
        directory=""
        className="hidden"
        onChange={(e) => { handle(e.target.files); if (folderRef.current) folderRef.current.value = ""; }}
      />
    </div>
  );
}