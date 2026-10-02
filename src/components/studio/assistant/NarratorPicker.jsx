import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, Check, Pencil } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import NarratorEditor from "@/components/studio/assistant/NarratorEditor";
import { kindOf } from "@/lib/narratorStyle";

// Ein oder zwei Erzählerinnen wählen — oder gleich hier eine neue anlegen.
export default function NarratorPicker({ value = [], onChange }) {
  const { toast } = useToast();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = async (autoPick) => {
    const items = await base44.entities.Narrator.list("order").catch(() => []);
    setList(items);
    setLoading(false);
    if (autoPick && !value.length && items.length) onChange([items[0]]);
  };

  React.useEffect(() => { load(true); }, []);

  // Höchstens zwei — eine dritte ersetzt die erste.
  const toggle = (n) => {
    const has = value.some((v) => v.id === n.id);
    if (has) return onChange(value.filter((v) => v.id !== n.id));
    if (value.length < 2) return onChange([...value, n]);
    onChange([value[1], n]);
  };

  const saved = (n) => {
    setEditing(null);
    setList((prev) => (prev.some((x) => x.id === n.id) ? prev.map((x) => (x.id === n.id ? n : x)) : [...prev, n]));
    onChange((prev) => (prev.some((x) => x.id === n.id) ? prev.map((x) => (x.id === n.id ? n : x)) : [...prev, n].slice(-2)));
  };

  const removed = (id) => {
    setEditing(null);
    setList((prev) => prev.filter((x) => x.id !== id));
    onChange((prev) => prev.filter((x) => x.id !== id));
  };

  return (
    <div className="rounded-2xl border-2 border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div>
          <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Wer führt dich durch</p>
          <p className="text-[13px] font-semibold text-muted-foreground">Eine oder zwei — sie sprechen abwechselnd.</p>
        </div>
        <button
          onClick={() => setEditing({})}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full glass-btn text-[12px] font-bold text-foreground"
        >
          <Plus className="w-3.5 h-3.5" /> Neue Erzählerin
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
      ) : list.length === 0 ? (
        <p className="text-[13px] font-semibold text-muted-foreground py-3">
          Noch keine angelegt — leg oben deine erste Erzählerin an.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {list.map((n) => {
            const on = value.some((v) => v.id === n.id);
            return (
              <span
                key={n.id}
                className={cn(
                  "inline-flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-full border-2 transition-colors",
                  on ? "border-primary bg-primary/10" : "border-border bg-elevated"
                )}
              >
                <button onClick={() => toggle(n)} className="inline-flex items-center gap-2">
                  {n.avatar ? (
                    <Image src={n.avatar} fittingType="fill" className="w-8 h-8 rounded-full" />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-background flex items-center justify-center text-[11px] font-bold text-muted-foreground">
                      {n.name.slice(0, 1)}
                    </span>
                  )}
                  <span className="text-left">
                    <span className="block text-[13px] font-bold text-foreground leading-tight">{n.name}</span>
                    <span className="block text-[11px] font-semibold text-muted-foreground">{kindOf(n.kind).label}</span>
                  </span>
                  {on && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>
                <button
                  onClick={() => setEditing(n)}
                  title="Einrichten"
                  className="w-6 h-6 rounded-full bg-background text-muted-foreground flex items-center justify-center hover:text-foreground"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {editing && (
        <NarratorEditor
          narrator={editing.id ? editing : null}
          onSaved={saved}
          onDeleted={removed}
          onCancel={() => setEditing(null)}
          onError={() => toast({ title: "Hat nicht geklappt", variant: "destructive" })}
        />
      )}
    </div>
  );
}