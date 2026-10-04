import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

// Ein Baustein-Topf: alles, was es von einer Sorte gibt, zum An- und Abwählen.
// Neue lassen sich direkt hier anlegen.
export default function ModulePicker({ label, hint, items = [], value = [], onToggle, onCreate }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");

  const add = () => {
    const t = title.trim();
    if (!t) return;
    onCreate(t);
    setTitle("");
    setOpen(false);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-heading">{label}</div>
          <div className="text-xs text-muted-foreground">{hint}</div>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setOpen((o) => !o)}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {open && (
        <div className="mt-3 flex gap-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="Neuer Baustein"
          />
          <Button size="sm" onClick={add}>
            Anlegen
          </Button>
        </div>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((m) => {
          const on = value.includes(m.id);
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onToggle(m.id)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm",
                on ? "border-primary text-primary" : "border-border text-muted-foreground"
              )}
            >
              {m.title}
            </button>
          );
        })}
        {!items.length && (
          <span className="text-sm text-muted-foreground">Noch nichts angelegt.</span>
        )}
      </div>
    </div>
  );
}