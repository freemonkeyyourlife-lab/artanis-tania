import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search } from "lucide-react";
import StoryListRow from "@/components/StoryListRow";

export default function Stories() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { load(); }, []);
  const load = async () => {
    try {
      const data = await base44.entities.Story.filter({ published: true }, "-created_date", 50);
      setStories(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // Smarter Filter: bewertet Treffer und sortiert die besten nach oben.
  const q = search.trim().toLowerCase();
  const terms = q ? q.split(/\s+/).filter(Boolean) : [];
  const scoreOf = (s) => {
    if (!q) return 0;
    const title = (s.title || "").toLowerCase();
    const cn = (s.creatorName || "").toLowerCase();
    const prev = (s.preview || "").toLowerCase();
    const tops = (s.topics || []).join(" ").toLowerCase();
    let sc = 0;
    for (const t of terms) {
      if (title.includes(t)) sc += 3;
      if (cn.includes(t)) sc += 2;
      if (tops.includes(t)) sc += 1.5;
      if (prev.includes(t)) sc += 1;
    }
    return sc;
  };
  const filtered = q
    ? stories.map(s => ({ s, sc: scoreOf(s) })).filter(x => x.sc > 0).sort((a, b) => b.sc - a.sc).map(x => x.s)
    : stories;
  const highlightIds = new Set(q ? filtered.slice(0, 3).map(s => s.id) : []);

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8">
      <h1 className="font-display text-3xl text-foreground mb-2">Storys</h1>
      <p className="text-muted-foreground text-sm mb-6">Geschichten zum Eintauchen — von allen Charakteren</p>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Storys durchsuchen …" className="w-full pl-11 pr-4 py-3 rounded-2xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-4">
          {filtered.map(story => <StoryListRow key={story.id} story={story} highlight={highlightIds.has(story.id)} />)}
          {filtered.length === 0 && <p className="text-muted-foreground text-center py-12">Keine Storys gefunden</p>}
        </div>
      )}
    </div>
  );
}