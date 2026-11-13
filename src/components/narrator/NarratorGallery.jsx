import React, { useRef, useState } from "react";
import { Image } from "@/components/ui/image";
import { Star, Trash2, Pencil, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import { labelCls } from "@/lib/narratorUi";

// Ihre Sammlung — jedes Bild lässt sich ziehen, austauschen, zum Gesicht
// machen oder entfernen. Nichts ist mehr festgenagelt: die Reihenfolge ist
// frei per Drag-and-drop, das erste (Platzhalter-)Bild geht genauso weg wie
// jedes andere, und ein Klick auf das Stift-Symbol tauscht es gegen ein
// eigenes Bild aus.
export default function NarratorGallery({
  gallery,
  face,
  onFace,
  onReorder,
  onRemove,
  onClearFace,
  onReplace,
}) {
  const [confirm, setConfirm] = useState(null);
  const fileRef = useRef(null);
  const replaceUrl = useRef(null);

  const pickReplace = (url) => {
    replaceUrl.current = url;
    fileRef.current?.click();
  };

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    const url = replaceUrl.current;
    replaceUrl.current = null;
    e.target.value = "";
    if (!file || !url) return;
    onReplace?.(url, file);
  };

  const onDragEnd = (res) => {
    if (!res?.destination || res.destination.index === res.source.index) return;
    const next = [...gallery];
    const [moved] = next.splice(res.source.index, 1);
    next.splice(res.destination.index, 0, moved);
    onReorder?.(next);
  };

  return (
    <div className="mt-5">
      <label className={labelCls}>
        Ihre Sammlung · {gallery.length}
        <span className="font-semibold normal-case tracking-normal opacity-70">
          {" "}ziehen · austauschen · wählen · entfernen
        </span>
      </label>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="narrator-gallery" direction="horizontal">
          {(dropProvided) => (
            <div
              ref={dropProvided.innerRef}
              {...dropProvided.droppableProps}
              className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2"
            >
              {gallery.map((url, i) => {
                const isFace = face === url;
                return (
                  <Draggable key={url} draggableId={url} index={i}>
                    {(dragProvided, dragSnapshot) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                        {...dragProvided.dragHandleProps}
                        className={cn(
                          "relative group rounded-xl overflow-hidden border-2 aspect-[3/4] bg-elevated touch-none",
                          dragSnapshot.isDragging ? "border-primary shadow-2xl z-10" : "border-border"
                        )}
                      >
                        <Image src={url} fittingType="fill" className="w-full h-full pointer-events-none" />
                        {isFace && (
                          <span className="absolute top-0 left-0 right-0 text-center text-[10px] font-bold bg-primary text-primary-foreground py-0.5">
                            Gesicht
                          </span>
                        )}

                        {/* Der Griffige-Griff — immer leicht sichtbar, damit man
                            weiß: hier zieht man. */}
                        <span className="absolute top-1 left-1 w-6 h-6 rounded-md bg-black/55 text-white flex items-center justify-center opacity-60 group-hover:opacity-100 transition-opacity">
                          <GripVertical className="w-3.5 h-3.5" />
                        </span>

                        {/* Löschen ist immer sichtbar — die alten Platzhalter
                            gehen endlich weg, ohne suchen zu müssen. */}
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirm(url); }}
                          title="Entfernen"
                          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Gesicht wählen + austauschen — kommen beim Hovern. */}
                        <div className="absolute inset-0 flex flex-col justify-end gap-1 p-1 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={(e) => { e.stopPropagation(); onFace?.(url); }}
                              title="Als ihr Gesicht"
                              className={cn(
                                "w-7 h-7 rounded-full flex items-center justify-center",
                                isFace ? "bg-primary text-primary-foreground" : "bg-white/90 text-black"
                              )}
                            >
                              <Star className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); pickReplace(url); }}
                              title="Austauschen / bearbeiten"
                              className="w-7 h-7 rounded-full bg-white/90 text-black flex items-center justify-center"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                );
              })}
              {dropProvided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <p className="text-[12px] font-semibold text-muted-foreground mt-2">
        Bild am Griff ziehen, um die Reihenfolge zu ändern. Stift = eigenes Bild dafür einsetzen, Stern = als Gesicht festlegen, Mülleimer = entfernen.
      </p>

      {face && onClearFace && (
        <button
          onClick={onClearFace}
          className="mt-2 text-[12px] font-bold text-muted-foreground hover:text-destructive transition-colors"
        >
          Gesichtsbild entfernen (Platzhalter weg)
        </button>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={onFile}
        className="hidden"
      />

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