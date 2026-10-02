import React from "react";
import { Link } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Plus, Lock, Compass } from "lucide-react";
import SitePageRow from "@/components/owner/SitePageRow";
import { MODULE_TYPES, FIXED_AREAS, ALWAYS_IN_MENU, MENU_AREA_LABEL, fixedAreaItems } from "@/lib/modules";

// Die ganze App als Karte: vier Bereiche in der Kopfzeile, dazu alle Seiten,
// die es gibt — verschiebbar, umbenennbar, ein- und ausblendbar, neu einbindbar.
export default function SiteOverview({ items, onChange }) {
  const move = (index, to) => {
    if (to < 0 || to >= items.length || to === index) return;
    const next = [...items];
    const [moved] = next.splice(index, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const onDragEnd = (result) => {
    if (result.destination) move(result.source.index, result.destination.index);
  };

  const patch = (index, patchItem) =>
    onChange(items.map((it, i) => (i === index ? { ...it, ...patchItem } : it)));

  const remove = (index) => onChange(items.filter((_, i) => i !== index));

  const embed = (page) =>
    onChange([...items, { id: `mod-${Date.now()}`, label: page.label, path: page.path, hidden: false }]);

  const taken = new Set([
    ...items.map((i) => i.path),
    ...fixedAreaItems().map((i) => i.path),
    ...ALWAYS_IN_MENU.map((i) => i.path),
  ]);
  const available = MODULE_TYPES.filter((m) => !taken.has(m.path));
  const hiddenCount = items.filter((i) => i.hidden).length;

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl border border-border p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
          <p className="font-display text-xl text-foreground">Bereich „{MENU_AREA_LABEL}“ — deine Knöpfe</p>
          <span className="text-[13px] font-bold text-muted-foreground">
            {items.length} {items.length === 1 ? "Eintrag" : "Einträge"}
            {hiddenCount > 0 && ` · ${hiddenCount} ausgeblendet`}
          </span>
        </div>
        <p className="text-[15px] font-semibold text-muted-foreground mb-4">
          Ziehen oder die Zahl ändern — die Reihenfolge hier ist die Reihenfolge oben in der Kopfzeile.
          Doppelte Einträge zeigt die Kopfzeile nur einmal, der oberste zählt.
        </p>

        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="site-overview">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                {items.map((item, index) => (
                  <Draggable key={item.id || item.path} draggableId={item.id || item.path} index={index}>
                    {(p) => (
                      <div ref={p.innerRef} {...p.draggableProps}>
                        <SitePageRow
                          item={item}
                          index={index}
                          total={items.length}
                          dragHandleProps={p.dragHandleProps}
                          onChange={(patchItem) => patch(index, patchItem)}
                          onMove={move}
                          onRemove={() => remove(index)}
                        />
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {items.length === 0 && (
          <p className="text-[15px] font-semibold text-muted-foreground">
            Noch nichts drin — binde unten eine Seite ein.
          </p>
        )}
      </div>

      <div className="glass rounded-2xl border border-border p-5">
        <p className="font-display text-xl text-foreground mb-1">Noch nicht eingebunden</p>
        <p className="text-[15px] font-semibold text-muted-foreground mb-4">
          Diese Seiten gibt es in der App, sie stehen aber nicht in der Kopfzeile. Ein Klick bindet sie ein.
        </p>
        {available.length === 0 ? (
          <p className="text-[15px] font-semibold text-muted-foreground">Alle Seiten sind eingebunden.</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {available.map((m) => (
              <button
                key={m.path}
                onClick={() => embed(m)}
                title={m.description}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full glass-btn text-[14px] font-bold text-foreground"
              >
                <Plus className="w-4 h-4" /> {m.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="glass rounded-2xl border border-border p-5">
        <p className="font-display text-xl text-foreground mb-1">Feste Bereiche</p>
        <p className="text-[15px] font-semibold text-muted-foreground mb-4">
          Diese Bereiche stehen immer in der Kopfzeile und werden nicht aus deinem Menü bestückt.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {FIXED_AREAS.map((area) => (
            <div key={area.label} className="rounded-xl border border-border p-4">
              <p className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                <Lock className="w-3.5 h-3.5" /> {area.label}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {area.items.map((it) => (
                  <Link
                    key={it.path}
                    to={it.path}
                    className="px-3 py-1.5 rounded-full bg-elevated border border-border text-[13px] font-bold text-foreground hover:border-primary/50"
                  >
                    {it.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-border p-4 mt-4">
          <p className="inline-flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
            <Compass className="w-3.5 h-3.5" /> Immer unter „{MENU_AREA_LABEL}“
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ALWAYS_IN_MENU.map((it) => (
              <Link
                key={it.path}
                to={it.path}
                className="px-3 py-1.5 rounded-full bg-elevated border border-border text-[13px] font-bold text-foreground hover:border-primary/50"
              >
                {it.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}