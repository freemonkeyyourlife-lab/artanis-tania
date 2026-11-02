import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search } from "lucide-react";
import ContentCard from "@/components/ContentCard";
import { cn } from "@/lib/utils";

export default function ContentBrowser({ defaultContentType, title, subtitle }) {
  const [content, setContent] = useState([]);
  const [topics, setTopics] = useState([]);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [creatorFilter, setCreatorFilter] = useState("all");
  const [topicFilter, setTopicFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState("all");
  const [sort, setSort] = useState("newest");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [contentData, topicData, creatorData] = await Promise.all([
        base44.entities.Content.filter({ published: true }, "-created_date", 100),
        base44.entities.Topic.list(),
        base44.entities.Creator.list(),
      ]);
      setContent(contentData);
      setTopics(topicData);
      setCreators(creatorData);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  let filtered = content;
  if (defaultContentType) filtered = filtered.filter(c => c.contentType === defaultContentType);
  if (creatorFilter !== "all") filtered = filtered.filter(c => c.creatorId === creatorFilter);
  if (topicFilter !== "all") filtered = filtered.filter(c => c.topics?.includes(topicFilter));
  if (priceFilter === "free") filtered = filtered.filter(c => c.isFree);
  if (priceFilter === "vip") filtered = filtered.filter(c => c.visibility === "VIP");
  if (priceFilter === "ppv") filtered = filtered.filter(c => c.visibility === "PPV");

  // Smarter Filter: erkennt, wonach gesucht wird, bewertet jeden Treffer und
  // hebt die besten hervor. Titel wiegt am stärksten, dann Ersteller, Themen, Beschreibung.
  const q = search.trim().toLowerCase();
  const terms = q ? q.split(/\s+/).filter(Boolean) : [];
  const scoreOf = (c) => {
    if (!q) return 0;
    const title = (c.title || "").toLowerCase();
    const cn = (c.creatorName || "").toLowerCase();
    const desc = (c.description || "").toLowerCase();
    const tops = (c.topics || []).join(" ").toLowerCase();
    let s = 0;
    for (const t of terms) {
      if (title.includes(t)) s += 3;
      if (cn.includes(t)) s += 2;
      if (tops.includes(t)) s += 1.5;
      if (desc.includes(t)) s += 1;
    }
    if (title.includes(q)) s += 2;
    if (cn.includes(q)) s += 1;
    return s;
  };
  let result = filtered;
  if (q) {
    const scored = filtered.map(c => ({ c, s: scoreOf(c) })).filter(x => x.s > 0);
    scored.sort((a, b) => b.s - a.s);
    result = scored.map(x => x.c);
  } else if (sort === "popular") {
    result = [...filtered].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
  }
  const highlightIds = new Set(q ? result.slice(0, 3).map(c => c.id) : []);

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-8">
      <h1 className="font-display text-3xl text-foreground mb-2">{title}</h1>
      {subtitle && <p className="text-muted-foreground text-sm mb-6">{subtitle}</p>}

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Inhalte durchsuchen …"
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <select value={creatorFilter} onChange={(e) => setCreatorFilter(e.target.value)} className="px-3 py-2 rounded-full bg-card border border-border text-xs text-foreground focus:outline-none focus:border-primary/50 cursor-pointer">
          <option value="all">Alle Charaktere</option>
          {creators.map(c => <option key={c.id} value={c.id}>{c.stageName}</option>)}
        </select>
        <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)} className="px-3 py-2 rounded-full bg-card border border-border text-xs text-foreground focus:outline-none focus:border-primary/50 cursor-pointer">
          <option value="all">Alle Themen</option>
          {topics.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
        </select>
        <div className="flex gap-1">
          {[["all", "Alle"], ["free", "Gratis"], ["vip", "VIP"], ["ppv", "Einzeln"]].map(([p, label]) => (
            <button key={p} onClick={() => setPriceFilter(p)} className={cn("px-3 py-2 rounded-full text-xs font-medium transition-colors", priceFilter === p ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground")}>
              {label}
            </button>
          ))}
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="px-3 py-2 rounded-full bg-card border border-border text-xs text-foreground focus:outline-none focus:border-primary/50 cursor-pointer">
          <option value="newest">Neueste</option>
          <option value="popular">Beliebt</option>
        </select>
      </div>

      <p className="text-sm text-muted-foreground mb-4">{result.length} Einträge{q ? " · beste Treffer zuerst" : ""}</p>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {result.map(item => <ContentCard key={item.id} content={item} highlight={highlightIds.has(item.id)} />)}
          {result.length === 0 && <p className="text-muted-foreground col-span-full text-center py-12">Nichts gefunden</p>}
        </div>
      )}
    </div>
  );
}