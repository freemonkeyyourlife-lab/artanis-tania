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
  if (search) filtered = filtered.filter(c =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.description?.toLowerCase().includes(search.toLowerCase()) ||
    c.creatorName?.toLowerCase().includes(search.toLowerCase())
  );
  if (sort === "popular") filtered = [...filtered].sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

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
          placeholder="Search content..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-colors"
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        <select value={creatorFilter} onChange={(e) => setCreatorFilter(e.target.value)} className="px-3 py-2 rounded-full bg-card border border-border text-xs text-foreground focus:outline-none focus:border-primary/50 cursor-pointer">
          <option value="all">All Creators</option>
          {creators.map(c => <option key={c.id} value={c.id}>{c.stageName}</option>)}
        </select>
        <select value={topicFilter} onChange={(e) => setTopicFilter(e.target.value)} className="px-3 py-2 rounded-full bg-card border border-border text-xs text-foreground focus:outline-none focus:border-primary/50 cursor-pointer">
          <option value="all">All Topics</option>
          {topics.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
        </select>
        <div className="flex gap-1">
          {["all", "free", "vip", "ppv"].map(p => (
            <button key={p} onClick={() => setPriceFilter(p)} className={cn("px-3 py-2 rounded-full text-xs font-medium capitalize transition-colors", priceFilter === p ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground")}>
              {p}
            </button>
          ))}
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="px-3 py-2 rounded-full bg-card border border-border text-xs text-foreground focus:outline-none focus:border-primary/50 cursor-pointer">
          <option value="newest">Newest</option>
          <option value="popular">Popular</option>
        </select>
      </div>

      <p className="text-sm text-muted-foreground mb-4">{filtered.length} items</p>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(item => <ContentCard key={item.id} content={item} />)}
          {filtered.length === 0 && <p className="text-muted-foreground col-span-full text-center py-12">No content found</p>}
        </div>
      )}
    </div>
  );
}