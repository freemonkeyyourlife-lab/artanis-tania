import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { FolderOpen, Loader2, Plus } from "lucide-react";
import IdeaForm from "@/components/ideen/IdeaForm";
import IdeaCard from "@/components/ideen/IdeaCard";
import { btnAccentCls } from "@/lib/narratorUi";

// Der Ordner für Ideen und Geschichten — und die Menschen, die dazugehören.
export default function IdeenOrdner() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  const load = async () => {
    const page = await base44.entities.Idea.filter({}, { sort: "-created_date", limit: 100 });
    setItems(page?.items || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const saved = () => {
    setEditing(null);
    load();
  };

  const deleted = (id) => {
    setEditing(null);
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">Ideen-Ordner</h1>
          <p className="text-[15px] font-semibold text-muted-foreground max-w-2xl leading-relaxed">
            Hier kommt alles zusammen: die Idee, die Geschichte, die Menschen, die dazugehören, der Prompt — und die
            Bilder, die du dazu hochlädst.
          </p>
        </div>
        <button onClick={() => setEditing({})} className={btnAccentCls}>
          <Plus className="w-4 h-4" /> Neue Idee
        </button>
      </div>

      {editing && (
        <IdeaForm
          key={editing.id || "neu"}
          idea={editing.id ? editing : null}
          onSaved={saved}
          onCancel={() => setEditing(null)}
          onDeleted={deleted}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-border py-16 text-center">
          <FolderOpen className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-[15px] font-semibold text-muted-foreground">
            Der Ordner ist noch leer — leg deine erste Idee an.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {items.map((idea) => (
            <IdeaCard key={idea.id} idea={idea} onEdit={setEditing} />
          ))}
        </div>
      )}
    </div>
  );
}