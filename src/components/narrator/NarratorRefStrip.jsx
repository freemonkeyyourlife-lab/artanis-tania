import React from "react";
import { Image } from "@/components/ui/image";
import { Loader2, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { labelCls, btnCls } from "@/lib/narratorUi";

// Das Vorlagebild: ihr Gesicht bleibt gesetzt, dazu kommen eigene Vorlagen.
// Aus einer Vorlage wird umgebaut — andere Pose, andere Perspektive, anderes
// Licht — und sie bleibt trotzdem sie selbst.
export default function NarratorRefStrip({ face, refs, onUpload, onRemove, uploading }) {
  return (
    <div>
      <label className={labelCls}>
        Vorlagebilder · {face ? 1 + refs.length : refs.length}
        <span className="font-semibold normal-case tracking-normal opacity-70"> daraus wird umgebaut</span>
      </label>

      <div className="flex flex-wrap items-center gap-2">
        {face && (
          <div className="relative">
            <Image src={face} fittingType="fill" className="w-20 h-20 rounded-2xl border-2 border-primary/50" />
            <span className="absolute bottom-0 left-0 right-0 text-center text-[10px] font-bold bg-black/60 text-white rounded-b-2xl py-0.5">
              Gesicht
            </span>
          </div>
        )}

        {refs.map((url) => (
          <div key={url} className="relative">
            <Image src={url} fittingType="fill" className="w-20 h-20 rounded-2xl border-2 border-border" />
            <button
              onClick={() => onRemove(url)}
              title="Vorlage entfernen"
              className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}

        <label className={cn(btnCls, "cursor-pointer")}>
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Vorlage
          <input type="file" accept="image/*" multiple onChange={onUpload} className="hidden" />
        </label>
      </div>

      <p className="text-[12px] font-semibold text-muted-foreground mt-2">
        Der Standard-Generator baut aus jeder Vorlage um. Bild-zu-Bild-Modelle tun es auch — die übrigen Modelle
        erfinden frei aus deinem Prompt.
      </p>
    </div>
  );
}