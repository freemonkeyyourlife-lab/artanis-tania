import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2 } from "lucide-react";
import StoryForm from "@/components/studio/StoryForm";

export default function StoryManager({ creators }) {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try { setStories(await base44.entities.Story.list("-created_date")); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const remove = async (s) => {
    if (!window.confirm(`"${s.title}" wirklich löschen?`)) return;
    await base44.entities.Story.delete(s.id);
    load();
  };

  if (loading) {
    return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setEditing("new")} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
          <Plus className="w-4 h-4" /> Neue Story
        </button>
      </div>

      {editing && (
        <div className="mb-6">
          <StoryForm
            initial={editing === "new" ? null : editing}
            creators={creators}
            onSaved={() => { setEditing(null); load(); }}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {stories.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">Noch keine Storys — leg deine erste an.</p>
      ) : (
        <div className="space-y-3">
          {stories.map((s) => (
            <div key={s.id} className="rounded-2xl border border-border bg-card p-4 flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-medium text-foreground truncate">{s.title}</p>
                  {s.published ? (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-600/90 text-white text-[10px] font-semibold uppercase">Live</span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-elevated text-muted-foreground text-[10px] font-semibold uppercase">Entwurf</span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{(s.preview || s.content || "").slice(0, 180)}</p>
                {s.creatorName && <p className="text-[11px] text-muted-foreground mt-1">von {s.creatorName}{s.price > 0 ? ` · ${s.price} €` : " · gratis"}</p>}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => setEditing(s)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-elevated border border-border text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <Pencil className="w-3.5 h-3.5" /> Bearbeiten
                </button>
                <button onClick={() => remove(s)} className="w-9 h-9 rounded-full bg-destructive/15 text-destructive flex items-center justify-center hover:bg-destructive/25 transition-colors">
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