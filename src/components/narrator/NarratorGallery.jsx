import React, { useState } from "react";
import { Image } from "@/components/ui/image";
import { Star, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { labelCls } from "@/lib/narratorUi";

// Ihre Sammlung — jedes Bild lässt sich verschieben, zum Gesicht machen oder
// entfernen. Nichts ist mehr festgenagelt: die Reihenfolge ist frei, das erste
// (Platzhalter-)Bild geht genauso weg wie jedes andere.
export default function NarratorGallery({ gallery, face, onFace, onReorder, onRemove, onClearFace }) {
  const [confirm, setConfirm] = useState(null);

  const move = (from, to) => {
    if (to < 0 || to >= gallery.length) return;
    const next = [...gallery];
    [next[from], next[to]] = [next[to], next[from]];
    onReorder?.(next);
  };

  return (
    <div className="mt-5">
      <label className={labelCls}>
        Ihre Sammlung · {gallery.length}
        <span className="font-semibold normal-case tracking-normal opacity-70"> verschieben, wählen, entfernen</span>
      </label>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
        {gallery.map((url, i) => {
          const isFace = face === url;
          return (
            <div
              key={url}
              className="relative group rounded-xl overflow-hidden border-2 border-border aspect-[3/4] bg-elevated"
            >
              <Image src={url} fittingType="fill" className="w-full h-full" />
              {isFace && (
                <span className="absolute top-0 left-0 right-0 text-center text-[10px] font-bold bg-primary text-primary-foreground py-0.5">
                  Gesicht
                </span>
              )}
              <div className="absolute inset-0 flex flex-col justify-end gap-1 p-1 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <div className="flex items-center justify-center gap-1">
                  <button
                    onClick={() => onFace?.(url)}
                    title="Als ihr Gesicht"
                    className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center",
                      isFace ? "bg-primary text-primary-foreground" : "bg-white/90 text-black"
                    )}
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => move(i, i - 1)}
                    title="Nach links"
                    disabled={i === 0}
                    className="w-7 h-7 rounded-full bg-white/90 text-black flex items-center justify-center disabled:opacity-30"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => move(i, i + 1)}
                    title="Nach rechts"
                    disabled={i === gallery.length - 1}
                    className="w-7 h-7 rounded-full bg-white/90 text-black flex items-center justify-center disabled:opacity-30"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setConfirm(url)}
                    title="Entfernen"
                    className="w-7 h-7 rounded-full bg-destructive text-white flex items-center justify-center"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {face && onClearFace && (
        <button
          onClick={onClearFace}
          className="mt-2 text-[12px] font-bold text-muted-foreground hover:text-destructive transition-colors"
        >
          Gesichtsbild entfernen (Platzhalter weg)
        </button>
      )}

      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setConfirm(null)}>
          <div className="glass rounded-2xl border-2 border-border p-5 max-w-xs w-full" onClick={(e) => e.stopPropagation()}>
            <p className="text-[14px] font-bold text-foreground mb-1">Bild entfernen?</p>
            <p className="text-[12px] font-semibold text-muted-foreground mb-4">
              Es verschwindet aus der Sammlung. Das lässt sich nicht rückgängig machen.
            </p>
            <div className="flex items-center justify-end gap-2">
              <button onClick={() => setConfirm(null)} className="px-3 py-2 rounded-full bg-elevated text-[12px] font-bold">
                Abbrechen
              </button>
              <button
                onClick={() => { onRemove?.(confirm); setConfirm(null); }}
                className="px-3 py-2 rounded-full bg-destructive text-white text-[12px] font-bold"
              >
                Entfernen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}