import React, { useRef, useState } from "react";
import { FolderUp, Loader2, Upload } from "lucide-react";
import { uploadToArchive } from "@/lib/imageArchive";
import { collectDroppedFiles, isImage } from "@/lib/folderDrop";

// Upload-Zone für die Galerie: einzelne Dateien oder ganze Ordner per
// Drag-and-Drop. Alles landet im Archiv (ImageArchive) — nach dem Upload
// lädt die Galerie neu.
export default function GalleryUpload({ onUploaded, kind = "ALLGEMEIN" }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);
  const [drag, setDrag] = useState(false);
  const fileRef = useRef(null);
  const folderRef = useRef(null);

  const run = async (files) => {
    const imgs = Array.from(files || []).filter(isImage);
    if (!imgs.length) return;
    setBusy(true);
    setTotal(imgs.length);
    setDone(0);
    for (const f of imgs) {
      try { await uploadToArchive([f], { kind }); } catch { /* einzelne überspringen */ }
      setDone((d) => d + 1);
    }
    setBusy(false);
    onUploaded?.();
  };

  const onDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDrag(false);
    const files = await collectDroppedFiles(e.dataTransfer);
    if (files.length) run(files);
  };

  return (
    <div
      onDrop={onDrop}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      className={`flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-8 text-center transition-colors ${drag ? "border-primary bg-primary/10" : "border-border bg-elevated"}`}
    >
      {busy ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : (
        <Upload className="h-6 w-6 text-primary" />
      )}
      <span className="font-heading text-foreground">
        {busy ? `Lade hoch … ${done}/${total || "?"}` : "Bilder oder ganzen Ordner ablegen"}
      </span>
      <span className="text-xs text-muted-foreground">
        Per Drag & Drop reinziehen — auch ganze Ordner. Alles bleibt im Archiv.
      </span>
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
        >
          Dateien
        </button>
        <button
          type="button"
          onClick={() => folderRef.current?.click()}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground"
        >
          <FolderUp className="w-3.5 h-3.5" /> Ordner
        </button>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => { run(e.target.files); e.target.value = ""; }}
      />
      <input
        ref={folderRef}
        type="file"
        multiple
        hidden
        onClick={(e) => { e.currentTarget.setAttribute("webkitdirectory", ""); }}
        onChange={(e) => { run(e.target.files); e.target.value = ""; }}
      />
    </div>
  );
}