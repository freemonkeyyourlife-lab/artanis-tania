import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { BookOpen, ChevronDown, ChevronUp, Search } from "lucide-react";

export default function Stories() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, []);
  const load = async () => {
    try {
      const data = await base44.entities.Story.filter({ published: true }, "-created_date", 50);
      setStories(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filtered = stories.filter(s =>
    s.title?.toLowerCase().includes(search.toLowerCase()) ||
    s.preview?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8">
      <h1 className="font-display text-3xl text-foreground mb-2">Stories</h1>
      <p className="text-muted-foreground text-sm mb-6">Immersive written experiences from all personas</p>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search stories..." className="w-full pl-11 pr-4 py-3 rounded-2xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-4">
          {filtered.map(story => (
            <div key={story.id} className="rounded-2xl border border-border bg-card overflow-hidden">
              <button onClick={() => setExpanded(expanded === story.id ? null : story.id)} className="w-full p-5 text-left flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <BookOpen className="w-4 h-4 text-primary" />
                    {story.series && <span className="text-xs text-primary">{story.series} · Ep. {story.episode || 1}</span>}
                  </div>
                  <h3 className="font-display text-xl text-foreground">{story.title}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{story.creatorName}</p>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{story.preview}</p>
                  {story.topics && story.topics.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {story.topics.map((t, i) => <span key={i} className="px-2 py-0.5 rounded-full glass text-[11px] text-muted-foreground">{t}</span>)}
                    </div>
                  )}
                </div>
                {expanded === story.id ? <ChevronUp className="w-5 h-5 text-muted-foreground flex-shrink-0" /> : <ChevronDown className="w-5 h-5 text-muted-foreground flex-shrink-0" />}
              </button>
              {expanded === story.id && (
                <div className="px-5 pb-5 border-t border-border pt-4">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{story.content}</p>
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && <p className="text-muted-foreground text-center py-12">No stories found</p>}
        </div>
      )}
    </div>
  );
}