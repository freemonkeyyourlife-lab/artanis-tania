import React, { useEffect, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { Link } from "react-router-dom";
import { GripVertical, Eye, EyeOff, ExternalLink, Loader2 } from "lucide-react";
import { DEFAULT_MENU, loadLayout, saveLayout } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";

// Die Reihenfolge deiner Bereiche — ziehen, ausblenden, speichern. Genau das,
// was die Kopfzeile oben anzeigt: hier ordnest du sie dir selbst.
export default function OrganizePanel() {
  const [items, setItems] = useState(null);
  const [record, setRecord] = useState(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    (async () => {
      const row = await loadLayout().catch(() => null);
      setRecord(row);
      setItems(Array.isArray(row?.navItems) && row.navItems.length ? row.navItems : DEFAULT_MENU);
    })();
  }, []);

  const move = (from, to) => {
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setItems(next);
    setNotice("");
  };

  const toggle = (index) => {
    setItems(items.map((it, i) => (i === index ? { ...it, hidden: !it.hidden } : it)));
    setNotice("");
  };

  const save = async () => {
    setSaving(true);
    setNotice("");
    try {
      const saved = await saveLayout(record, { navItems: items });
      setRecord(saved);
      // Die Kopfzeile holt sich die Reihenfolge sofort neu — kein Neuladen nötig.
      window.dispatchEvent(new Event("artanis:layout-changed"));
      setNotice("Gespeichert — die Reihenfolge ist jetzt live.");
    } catch (e) {
      console.error(e);
      setNotice("Speichern hat nicht geklappt. Versuch es nochmal.");
    } finally {
      setSaving(false);
    }
  };

  if (!items) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const visible = items.filter((i) => !i.hidden).length;

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h3 className="font-display text-xl text-foreground">Neu organisieren</h3>
        <p className="text-[13px] font-semibold text-muted-foreground">
          Zieh die Bereiche in die Reihenfolge, die du brauchst. Ausgeblendete bleiben erhalten — du holst sie jederzeit zurück.
        </p>
      </div>

      <DragDropContext onDragEnd={(r) => r.destination && move(r.source.index, r.destination.index)}>
        <Droppable droppableId="organize">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="space-y-2 max-h-[55vh] overflow-y-auto pr-1"
            >
              {items.map((item, index) => (
                <Draggable key={item.id || item.path} draggableId={item.id || item.path} index={index}>
                  {(p) => (
                    <div
                      ref={p.innerRef}
                      {...p.draggableProps}
                      className={cn(
                        "flex items-center gap-2 rounded-2xl border-2 border-border bg-card p-2",
                        item.hidden && "opacity-50"
                      )}
                    >
                      <span {...p.dragHandleProps} className="cursor-grab text-muted-foreground px-1">
                        <GripVertical className="w-4 h-4" />
                      </span>
                      <span className="w-6 text-center text-xs font-bold text-muted-foreground">{index + 1}</span>
                      <span className="flex-1 min-w-0 text-[15px] font-bold text-foreground truncate">{item.label}</span>
                      <button
                        onClick={() => toggle(index)}
                        title={item.hidden ? "Wieder einblenden" : "Ausblenden"}
                        className={cn(
                          "h-9 px-3 rounded-full glass-btn text-xs font-bold flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap",
                          item.hidden ? "text-destructive" : "text-emerald-400"
                        )}
                      >
                        {item.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        {item.hidden ? "Aus" : "Sichtbar"}
                      </button>
                      <Link
                        to={item.path || "/"}
                        title="Anschauen"
                        className="w-9 h-9 rounded-full glass-btn flex items-center justify-center text-muted-foreground hover:text-primary flex-shrink-0"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="text-xs font-semibold text-muted-foreground">{visible} von {items.length} sichtbar</span>
        <div className="flex items-center gap-3">
          {notice && <span className="text-xs font-semibold text-primary">{notice}</span>}
          <button
            onClick={save}
            disabled={saving}
            className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-bold disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Speichern
          </button>
        </div>
      </div>
    </div>
  );
}