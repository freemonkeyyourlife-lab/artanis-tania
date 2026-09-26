import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import CharacterForm from "@/components/studio/CharacterForm";
import StoryManager from "@/components/studio/StoryManager";
import TopicManager from "@/components/studio/TopicManager";
import ContentManager from "@/components/studio/ContentManager";

const TABS = [
  { id: "characters", label: "Charaktere" },
  { id: "stories", label: "Storys" },
  { id: "topics", label: "Themen" },
  { id: "content", label: "Preise & Content" },
];

export default function Studio() {
  const [tab, setTab] = useState("characters");
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null | "new" | creator

  useEffect(() => { load(); }, []);
  const load = async () => {
    try { setCreators(await base44.entities.Creator.list("-created_date")); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const remove = async (c) => {
    if (!window.confirm(`"${c.stageName}" wirklich löschen?`)) return;
    await base44.entities.Creator.delete(c.id);
    load();
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-foreground">Studio</h1>
        <p className="text-muted-foreground text-sm">Verwalte Charaktere, Storys und Themen — alles selbst, ohne Umweg.</p>
      </div>

      <div className="flex gap-1 p-1 rounded-full bg-elevated border border-border w-fit mb-6">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn("px-5 py-2 rounded-full text-sm font-medium transition-colors", tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "stories" && <StoryManager creators={creators} />}
      {tab === "topics" && <TopicManager />}
      {tab === "content" && <ContentManager />}

      {tab === "characters" && (
      <>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Neuer Charakter
        </button>
      </div>

      {editing && (
        <div className="mb-8">
          <CharacterForm
            initial={editing === "new" ? null : editing}
            onSaved={() => { setEditing(null); load(); }}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {creators.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">Noch keine Charaktere — leg deinen ersten an.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {creators.map((c) => (
            <div key={c.id} className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="relative aspect-[3/4] bg-elevated">
                {c.avatar ? (
                  <Image src={c.avatar} fittingType="fill" className="w-full h-full" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-display text-3xl text-primary">{c.stageName[0]}</div>
                )}
                {c.featured && <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold">Featured</span>}
              </div>
              <div className="p-3">
                <p className="text-sm font-medium text-foreground truncate">{c.stageName}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {c.personaType === "SOLO_MALE" ? "Mann" : c.personaType === "COUPLE" ? "Paar" : "Frau"} · {c.creatorCategory === "REAL" ? "Real" : "KI"}
                </p>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setEditing(c)} className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full bg-elevated border border-border text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="w-3.5 h-3.5" /> Bearbeiten
                  </button>
                  <button onClick={() => remove(c)} className="w-9 h-9 rounded-full bg-destructive/15 text-destructive flex items-center justify-center hover:bg-destructive/25 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      </>
      )}
    </div>
  );
}