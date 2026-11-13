import React, { useState } from "react";
import { Pencil, Trash2, Download, Link2, Check, Package, Copy, RotateCcw } from "lucide-react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import { blockMedia } from "@/lib/baukasten";

// Ein fertiges Paket. Eigene kannst du ändern und exportieren, fremde übernehmen.
export default function KitCard({ kit, blocks, owned, onEdit, onDelete, onClone, onExport, onClear }) {
  const [copied, setCopied] = useState(false);

  const inner = blocks.filter((b) => (kit.blockIds || []).includes(b.id));
  const cover =
    kit.cover ||
    inner.map((b) => blockMedia(b).find((m) => m.type === "IMAGE")?.url).find(Boolean) ||
    "";

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/baukasten?kit=${kit.id}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      /* Zwischenablage gesperrt */
    }
  };

  return (
    <div className="glass rounded-2xl border-2 border-border overflow-hidden flex flex-col">
      {cover ? (
        <Image src={cover} fittingType="fill" className="w-full h-44" />
      ) : (
        <div className="w-full h-44 bg-elevated flex items-center justify-center">
          <Package className="w-8 h-8 text-muted-foreground" />
        </div>
      )}

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className="px-2.5 py-1 rounded-full bg-elevated text-muted-foreground text-[11px] font-bold">
            {inner.length} Bausteine
          </span>
          {kit.shared && (
            <span className="px-2.5 py-1 rounded-full bg-primary/15 text-primary text-[11px] font-bold uppercase">
              zum Nachbauen
            </span>
          )}
        </div>

        <p className="font-display text-lg text-foreground mb-1">{kit.name}</p>
        {kit.personaName && (
          <p className="text-[13px] font-semibold text-muted-foreground mb-1">{kit.personaName}</p>
        )}
        {kit.description && (
          <p className="text-[14px] font-semibold text-muted-foreground mb-3 flex-1">{kit.description}</p>
        )}

        <div className="flex flex-wrap gap-2 mt-auto pt-2">
          {owned ? (
            <>
              {onEdit && (
                <button
                  onClick={() => onEdit(kit)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full glass-btn text-[13px] font-bold text-foreground"
                >
                  <Pencil className="w-3.5 h-3.5" /> Ändern
                </button>
              )}
              {onExport && (
                <button
                  onClick={() => onExport(kit)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Download className="w-3.5 h-3.5" /> Datei
                </button>
              )}
              <button
                onClick={copyLink}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Link2 className="w-3.5 h-3.5" />}
                {copied ? "Kopiert" : "Link"}
              </button>
              {onClear && (
                <button
                  onClick={() => onClear(kit)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold text-muted-foreground hover:text-foreground transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Leeren
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(kit)}
                  className={cn("inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-[13px] font-bold text-muted-foreground hover:text-destructive transition-colors")}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Löschen
                </button>
              )}
            </>
          ) : (
            <button
              onClick={() => onClone(kit)}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full glass-btn glass-btn-accent text-[13px] font-bold text-gloss"
            >
              <Copy className="w-3.5 h-3.5" /> Selbst nachbauen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}