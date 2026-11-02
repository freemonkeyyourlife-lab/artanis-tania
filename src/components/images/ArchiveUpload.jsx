import React, { useRef, useState } from "react";
import { Image } from "@/components/ui/image";
import { Archive, FolderUp, Loader2, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadToArchive } from "@/lib/imageArchive";
import { collectDroppedFiles, isImage } from "@/lib/folderDrop";
import ArchivePicker from "@/components/images/ArchivePicker";

// Bilder hochladen — einzelne Dateien oder ganze Ordner per Drag-and-Drop.
// Alles landet gleich im Archiv, damit es nie wieder weg ist. Über „Aus dem
// Archiv" holt man alte Bilder zurück.
export default function ArchiveUpload({ value = [], onChange, kind = "ALLGEMEIN", multiple = true, className }) {
  const [busy, setBusy] = useState(false);
  const [drag, setDrag] = useState(false);
  const [open, setOpen] = useState(false);
  const fileRef = useRef(null);
  const folderRef = useRef(null);

  const add = async (files) => {
    const imgs = Array.from(files || []).filter(isImage);
    if (!imgs.length) return;
    setBusy(true);
    try {
      const urls = await uploadToArchive(imgs, { kind });
      onChange([...value, ...urls]);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
      if (folderRef.current) folderRef.current.value = "";
    }
  };

  const onDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDrag(false);
    const files = await collectDroppedFiles(e.dataTransfer);
    if (files.length) add(files);
  };

  const pick = (url) => {
    if (value.includes(url)) return;
    onChange(multiple ? [...value, url] : [url]);
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div
        onDrop={onDrop}
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        className={cn(
          "flex flex-wrap gap-2 rounded-xl p-1 transition-colors",
          drag && "ring-2 ring-primary/60 bg-primary/5"
        )}
      >
        {value.map((url) => (
          <div key={url} className="relative w-20 h-20">
            <Image src={url} fittingType="fill" className="w-20 h-20 rounded-xl border border-border" />
            <button
              type="button"
              onClick={() => onChange(value.filter((u) => u !== url))}
              className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          <span className="text-[10px] font-bold uppercase tracking-wider">Bild</span>
        </button>

        <button
          type="button"
          onClick={() => folderRef.current?.click()}
          className="h-20 px-3 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FolderUp className="w-4 h-4" />}
          <span className="text-[10px] font-bold uppercase tracking-wider">Ordner</span>
        </button>
      </div>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 text-[12px] font-bold text-muted-foreground hover:text-primary transition-colors"
      >
        <Archive className="w-3.5 h-3.5" /> {open ? "Archiv schließen" : "Aus dem Archiv"}
      </button>

      {open && <ArchivePicker kind={kind} onPick={pick} selected={value} />}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        hidden
        onChange={(e) => add(e.target.files)}
      />
      <input
        ref={folderRef}
        type="file"
        hidden
        // webkitdirectory wird im Effekt/Attribut gesetzt — whole folders
        onClick={(e) => { e.currentTarget.setAttribute("webkitdirectory", ""); }}
        onChange={(e) => add(e.target.files)}
      />
    </div>
  );
}