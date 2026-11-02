import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, Loader2 } from "lucide-react";

// Eine offene Ablage: Bilder und Videos von überall hochladen — mehrere
// gleichzeitig. Die Dateien bleiben privat bei der App.
export default function UploadZone({ onUploaded }) {
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(0);
  const [total, setTotal] = useState(0);

  const handle = async (files) => {
    const list = Array.from(files || []);
    if (!list.length) return;
    setBusy(true);
    setTotal(list.length);
    setDone(0);
    for (const file of list) {
      try {
        const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
        const type = file.type?.startsWith("video") ? "VIDEO" : "IMAGE";
        onUploaded(file_uri, type, file.name);
      } catch (e) {
        /* einzelne Datei überspringen */
      }
      setDone((d) => d + 1);
    }
    setBusy(false);
  };

  return (
    <label className="glass-btn flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border px-6 py-10 text-center">
      {busy ? (
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      ) : (
        <Upload className="h-6 w-6 text-primary" />
      )}
      <span className="font-heading text-foreground">
        {busy ? `Lade hoch … ${done}/${total}` : "Bilder oder Videos hochladen"}
      </span>
      <span className="text-xs text-muted-foreground">
        Festplatte, Foto, Laufwerk — mehrere gleichzeitig
      </span>
      <input
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => handle(e.target.files)}
      />
    </label>
  );
}