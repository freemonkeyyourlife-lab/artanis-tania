import React from "react";
import { Image } from "@/components/ui/image";
import { AlertTriangle, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const KIND_LABEL = { MODELL: "Modell", BILD: "Bild", VIDEO: "Video", AUDIO: "Audio", CHARAKTER: "Charakter", LINK: "Link" };

// Eine analysierte Adresse: Bild, Titel, Typ — und wohin sie beim Übernehmen wandert.
export default function LinkEnrichRow({ row, checked, onToggle }) {
  const target = row.kind === "MODELL" ? "Modell-Links" : "Dienste-Liste";

  return (
    <label
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl bg-elevated border border-border cursor-pointer",
        !row.ok && "opacity-70"
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(row.url)}
        className="w-4 h-4 accent-primary flex-shrink-0"
      />

      <div className="w-14 h-14 rounded-xl bg-background border border-border overflow-hidden flex-shrink-0">
        {row.image ? (
          <Image src={row.image} fittingType="fill" className="w-full h-full" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Globe className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[15px] font-bold text-foreground truncate">{row.title || row.host}</p>
        <p className="text-[12px] font-semibold text-muted-foreground truncate">{row.url}</p>
        {row.description && (
          <p className="text-[12px] font-semibold text-muted-foreground/80 line-clamp-2 mt-0.5">{row.description}</p>
        )}
      </div>

      <div className="hidden sm:flex flex-col items-end gap-1 flex-shrink-0">
        <span className="px-2.5 py-1 rounded-full bg-primary/15 text-primary text-[11px] font-bold whitespace-nowrap">
          {KIND_LABEL[row.kind] || row.kind}
        </span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap">
          → {target}
        </span>
        {row.modelId && (
          <span className="text-[11px] font-semibold text-muted-foreground truncate max-w-[180px]">{row.modelId}</span>
        )}
      </div>

      {!row.ok && (
        <span
          className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-destructive flex-shrink-0"
          title={row.error}
        >
          <AlertTriangle className="w-3.5 h-3.5" /> nicht gelesen
        </span>
      )}
    </label>
  );
}