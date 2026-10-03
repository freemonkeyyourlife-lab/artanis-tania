import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Loader2, Upload, X } from "lucide-react";

// Bilder direkt in den Ordner legen — hier wird nichts erzeugt.
export default function IdeaImages({ value = [], onChange }) {
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const add = async (files) => {
    setBusy(true);
    try {
      const urls = [];
      for (const file of files) {
        const res = await base44.integrations.Core.UploadPublicFile({ file });
        urls.push(res.file_url);
      }
      onChange([...value, ...urls]);
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
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
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => add([...e.target.files])}
      />
    </div>
  );
}