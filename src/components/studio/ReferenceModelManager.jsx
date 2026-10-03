import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus } from "lucide-react";
import ReferenceModelForm from "@/components/studio/ReferenceModelForm";
import ReferenceModelCard from "@/components/studio/ReferenceModelCard";

// Das Vorbild-Archiv: hier liegen die Frauen, die als Maßstab gelten — mit
// Bildern und einer Notiz, wofür jede taugt. Nur der Besitzer sieht es.
export default function ReferenceModelManager() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    try {
      setModels(await base44.entities.ReferenceModel.list("order"));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const remove = async (m) => {
    if (!window.confirm(`„${m.name}" wirklich löschen?`)) return;
    await base44.entities.ReferenceModel.delete(m.id);
    load();
  };

  if (loading) {
    return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <p className="font-display text-2xl text-foreground">Vorbilder</p>
          <p className="text-[14px] font-semibold text-muted-foreground max-w-2xl mt-1">
            Lade die Frauen hoch, die als Maßstab gelten — und schreib darunter, wofür jede verwendbar ist.
            Daraus bauen wir später die Bausteine.
          </p>
        </div>
        <button
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn glass-btn-accent text-[14px] font-bold text-gloss"
        >
          <Plus className="w-4 h-4" /> Neues Vorbild
        </button>
      </div>

      {editing && (
        <div className="mb-6">
          <ReferenceModelForm
            initial={editing === "new" ? null : editing}
            onSaved={() => { setEditing(null); load(); }}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {models.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">Noch keine Vorbilder — lad dein erstes hoch.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {models.map((m) => (
            <ReferenceModelCard key={m.id} model={m} onEdit={setEditing} onRemove={remove} />
          ))}
        </div>
      )}
    </div>
  );
}