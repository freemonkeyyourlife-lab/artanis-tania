import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, X, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import StoryCastSlot from "@/components/story/StoryCastSlot";

// Zwei Erzählerinnen für diese Geschichte auswählen — jede mit eigenem
// Aussehen, eigener Persönlichkeit und eigenem Stimm-Typ.
export default function StoryCastPanel({ onClose, onChanged }) {
  const { toast } = useToast();
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const items = await base44.entities.Narrator.list("order").catch(() => []);
    setAll(items);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const active = all.filter((n) => n.active !== false).slice(0, 2);
  const slots = [active[0] || null, active[1] || null];

  // Wer in einem Platz steht, ist aktiv — alle anderen sind es nicht.
  const setActiveFlags = async (chosenIds) => {
    await Promise.all(
      all
        .filter((n) => (n.active !== false) !== chosenIds.includes(n.id))
        .map((n) => base44.entities.Narrator.update(n.id, { active: chosenIds.includes(n.id) }))
    );
    await load();
    onChanged?.();
  };

  const assign = async (slotIdx, narrator) => {
    const ids = [slots[0]?.id, slots[1]?.id];
    ids[slotIdx] = narrator.id;
    await setActiveFlags(ids.filter(Boolean));
  };

  const clearSlot = async (slotIdx) => {
    const ids = [slots[0]?.id, slots[1]?.id];
    ids[slotIdx] = null;
    await setActiveFlags(ids.filter(Boolean));
  };

  const save = async (narrator, patch) => {
    await base44.entities.Narrator.update(narrator.id, patch);
    await load();
    onChanged?.();
    toast({ title: "Gespeichert", description: `„${patch.name}" ist eingestellt.` });
  };

  const createNew = async (slotIdx, name) => {
    const rec = await base44.entities.Narrator.create({ name, order: Date.now(), active: true });
    await assign(slotIdx, rec);
  };

  return (
    <div className="fixed inset-0 z-50 bg-background/85 backdrop-blur-sm overflow-y-auto p-4 lg:p-8">
      <div className="max-w-5xl mx-auto rounded-3xl glass-strong border-2 border-border p-5 lg:p-7">
        <div className="flex items-start gap-3 mb-5">
          <span className="w-11 h-11 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Users className="w-5 h-5 text-primary" />
          </span>
          <div className="min-w-0">
            <p className="font-display text-2xl text-foreground">Erzählerinnen dieser Geschichte</p>
            <p className="text-[14px] font-semibold text-muted-foreground">
              Zwei Plätze — beide begleiten dich durch die Stationen und wechseln sich ab. Jede mit eigenem Aussehen,
              eigener Persönlichkeit und eigenem Stimm-Typ.
            </p>
          </div>
          <button
            onClick={onClose}
            className="ml-auto w-10 h-10 rounded-full glass-btn flex items-center justify-center flex-shrink-0"
            title="Schließen"
          >
            <X className="w-5 h-5 text-foreground" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[0, 1].map((i) => (
              <StoryCastSlot
                key={i}
                slot={i}
                narrator={slots[i]}
                all={all}
                assignedIds={slots.map((s) => s?.id).filter(Boolean)}
                onAssign={assign}
                onClear={clearSlot}
                onSave={save}
                onCreate={createNew}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}