import React from "react";
import { Image } from "@/components/ui/image";
import { Bookmark, Download, ImagePlus, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { btnCls } from "@/lib/narratorUi";

// Ein Ergebnis: ansehen, behalten oder gleich als nächste Vorlage nehmen.
export default function NarratorImageResult({ item, onAvatar, onGallery, onRef }) {
  return (
    <div className="rounded-xl border-2 border-border bg-background p-3">
      <p className="text-[12px] font-bold text-foreground truncate mb-2">{item.label}</p>

      {item.error ? (
        <p className="text-[12px] font-semibold text-destructive">{item.error}</p>
      ) : (
        <>
          <div className="rounded-lg overflow-hidden bg-card">
            <Image src={item.url} fittingType="fit" className="w-full" />
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <button onClick={() => onAvatar(item.url)} className={cn(btnCls, "px-3 py-1.5 text-[11px]")}>
              <Star className="w-3 h-3" /> Ihr Bild
            </button>
            <button onClick={() => onGallery(item.url)} className={cn(btnCls, "px-3 py-1.5 text-[11px]")}>
              <ImagePlus className="w-3 h-3" /> Sammlung
            </button>
            <button onClick={() => onRef(item.url)} className={cn(btnCls, "px-3 py-1.5 text-[11px]")}>
              <Bookmark className="w-3 h-3" /> Als Vorlage
            </button>
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              download
              className={cn(btnCls, "px-3 py-1.5 text-[11px]")}
            >
              <Download className="w-3 h-3" /> Laden
            </a>
          </div>
        </>
      )}
    </div>
  );
}