import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2 } from "lucide-react";
import TopicForm from "@/components/studio/TopicForm";

export default function TopicManager() {
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try { setTopics(await base44.entities.Topic.list("name")); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const remove = async (t) => {
    if (!window.confirm(`"${t.name}" wirklich löschen?`)) return;
    await base44.entities.Topic.delete(t.id);
    load();
  };

  if (loading) {
    return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setEditing("new")} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
          <Plus className="w-4 h-4" /> Neues Thema
        </button>
      </div>

      {editing && (
        <div className="mb-6">
          <TopicForm
            initial={editing === "new" ? null : editing}
            onSaved={() => { setEditing(null); load(); }}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {topics.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">Noch keine Themen — leg dein erstes an.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {topics.map((t) => (
            <div key={t.id} className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3">
              <span className="text-xl leading-none flex-shrink-0">{t.icon || "•"}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground truncate">{t.name}</p>
                  {!t.enabled && <span className="px-2 py-0.5 rounded-full bg-elevated text-muted-foreground text-[10px] font-semibold uppercase">Inaktiv</span>}
                </div>
                {t.category && <p className="text-[11px] text-muted-foreground mt-0.5">{t.category}</p>}
                {t.description && <p className="text-xs text-muted-foreground mt-1">{t.description.slice(0, 140)}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => setEditing(t)} className="w-9 h-9 rounded-full bg-elevated border border-border text-muted-foreground flex items-center justify-center hover:text-foreground transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => remove(t)} className="w-9 h-9 rounded-full bg-destructive/15 text-destructive flex items-center justify-center hover:bg-destructive/25 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}