import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import ContentCard from "@/components/ContentCard";
import { cn } from "@/lib/utils";

export default function Topics() {
  const [topics, setTopics] = useState([]);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTopic, setActiveTopic] = useState(null);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try {
      const [t, c] = await Promise.all([
        base44.entities.Topic.list(),
        base44.entities.Content.filter({ published: true }, "-created_date", 100),
      ]);
      setTopics(t);
      setContent(c);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const filteredContent = activeTopic ? content.filter(c => c.topics?.includes(activeTopic)) : [];

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-8">
      <h1 className="font-display text-3xl text-foreground mb-2">Themen</h1>
      <p className="text-muted-foreground text-sm mb-6">Inhalte nach Thema durchstöbern</p>

      <div className="flex flex-wrap gap-2 mb-8">
        {topics.map(topic => (
          <button
            key={topic.id}
            onClick={() => setActiveTopic(activeTopic === topic.name ? null : topic.name)}
            className={cn("px-4 py-2 rounded-full text-sm font-medium transition-colors", activeTopic === topic.name ? "bg-primary text-primary-foreground" : "glass border border-border text-muted-foreground hover:text-foreground")}
          >
            {topic.name}
          </button>
        ))}
      </div>

      {activeTopic ? (
        <div>
          <h2 className="font-display text-xl text-foreground mb-4">{activeTopic}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredContent.map(item => <ContentCard key={item.id} content={item} />)}
            {filteredContent.length === 0 && <p className="text-muted-foreground col-span-full text-center py-12">Zu diesem Thema gibt es noch nichts</p>}
          </div>
        </div>
      ) : !loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {topics.map(topic => {
            const count = content.filter(c => c.topics?.includes(topic.name)).length;
            return (
              <button key={topic.id} onClick={() => setActiveTopic(topic.name)} className="p-5 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors text-left">
                <h3 className="font-display text-lg text-foreground">{topic.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{topic.category}</p>
                <p className="text-xs text-primary mt-2">{count} items</p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}