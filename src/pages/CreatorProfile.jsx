import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { MessageSquare, Heart, Sparkles, Pencil } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import ContentCard from "@/components/ContentCard";
import CharacterForm from "@/components/studio/CharacterForm";
import { cn } from "@/lib/utils";

export default function CreatorProfile({ personaType }) {
  const [creator, setCreator] = useState(null);
  const [content, setContent] = useState([]);
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [followed, setFollowed] = useState(false);
  const [tab, setTab] = useState("all");
  const [editing, setEditing] = useState(false);

  useEffect(() => { loadData(); }, [personaType]);

  const loadData = async () => {
    setLoading(true);
    try {
      const creators = await base44.entities.Creator.list();
      const c = creators.find(cr => cr.personaType === personaType);
      setCreator(c);
      if (c) {
        const [contentData, storyData] = await Promise.all([
          base44.entities.Content.filter({ creatorId: c.id, published: true }, "-created_date", 50),
          base44.entities.Story.filter({ creatorId: c.id, published: true }, "-created_date", 20),
        ]);
        setContent(contentData);
        setStories(storyData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-muted-foreground">Charakter nicht gefunden</p>
      </div>
    );
  }

  const filteredContent = tab === "all" ? content : content.filter(c => c.contentType === tab.toUpperCase());

  return (
    <div>
      {editing && (
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-8">
          <CharacterForm
            initial={creator}
            onSaved={() => { setEditing(false); loadData(); }}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}

      {/* Bühne: Banner liegt hinten, alles Weitere steht mittig darauf ausgerichtet. */}
      <div className="relative w-full overflow-hidden">
        <div className="absolute inset-0">
          <Image src={creator.banner || creator.avatar} fittingType="fill" className="w-full h-full scale-125 blur-2xl opacity-60" />
          <Image src={creator.banner || creator.avatar} fittingType="fill" focalPointY={0.35} className="w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/30" />
        </div>

        <div className="relative max-w-[1400px] mx-auto px-4 lg:px-8 pt-24 pb-10 flex flex-col items-center text-center">
          <div className="absolute top-4 left-4 lg:left-8">
            <StatusBadge status={creator.onlineStatus} />
          </div>

          <div className="w-32 h-32 lg:w-40 lg:h-40 rounded-3xl overflow-hidden border-2 border-border bg-card shadow-2xl">
            {/* Ausschnitt nach oben gezogen — im Rahmen sitzt das Gesicht, nicht der Bauch. */}
            <Image src={creator.avatar} fittingType="fill" focalPointX={0.5} focalPointY={0.1} className="w-full h-full" />
          </div>

          <h1 className="font-display text-4xl lg:text-5xl text-foreground text-gloss mt-6">{creator.stageName}</h1>
          <p className="text-muted-foreground mt-2">
            {creator.age ? `${creator.age} years old` : "Couple Persona"}
            {creator.personaType === "SOLO_MALE" && " · Male"}
            {creator.personaType === "SOLO_FEMALE" && " · Female"}
          </p>
          {creator.tagline && <p className="text-primary text-base font-semibold mt-3">{creator.tagline}</p>}
          <p className="text-sm text-muted-foreground mt-4 max-w-2xl leading-relaxed">{creator.bio}</p>

          <div className="flex flex-wrap justify-center gap-3 mt-7">
            <button
              onClick={() => setFollowed(!followed)}
              className={cn("inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold transition-all", followed ? "bg-primary/10 text-primary border border-primary/30" : "bg-primary text-primary-foreground hover:accent-glow")}
            >
              <Heart className={cn("w-4 h-4", followed && "fill-current")} /> {followed ? "Following" : "Follow"}
            </button>
            <Link to="/messages" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-border text-foreground text-sm font-semibold hover:border-primary/30 transition-all">
              <MessageSquare className="w-4 h-4" /> Message
            </Link>
            <Link to="/interactive" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-border text-foreground text-sm font-semibold hover:border-primary/30 transition-all">
              <Sparkles className="w-4 h-4 text-primary" /> Interactive
            </Link>
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass border border-border text-foreground text-sm font-semibold hover:border-primary/30 transition-all"
            >
              <Pencil className="w-4 h-4" /> Bearbeiten
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-3 mt-8">
            {[
              { v: creator.stats_followers || 0, l: "Follower" },
              { v: content.length, l: "Inhalte" },
              { v: stories.length, l: "Storys" },
            ].map((s) => (
              <div key={s.l} className="glass rounded-2xl border border-border px-7 py-3 min-w-[120px]">
                <p className="text-2xl font-display text-foreground">{s.v}</p>
                <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 pt-8 relative z-10">
        {/* Topics */}
        {creator.topics && creator.topics.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {creator.topics.map((t, i) => (
              <span key={i} className="px-3 py-1.5 rounded-full glass border border-border text-xs text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="mt-8 flex gap-2 overflow-x-auto scrollbar-hide border-b border-border pb-px">
          {[
            { id: "all", label: "Alle" },
            { id: "video", label: "Videos" },
            { id: "photo", label: "Fotos" },
            { id: "story", label: "Storys" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px",
                tab === t.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Grid */}
        <div className="mt-6 pb-12">
          {tab === "story" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stories.map((story) => (
                <div key={story.id} className="p-5 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors">
                  <h3 className="font-display text-lg text-foreground">{story.title}</h3>
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{story.preview || story.content}</p>
                  {story.series && <p className="text-xs text-primary mt-3">{story.series} · Ep. {story.episode || 1}</p>}
                </div>
              ))}
              {stories.length === 0 && <p className="text-muted-foreground col-span-2 text-center py-12">Noch keine Storys</p>}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredContent.map((item) => (
                <ContentCard key={item.id} content={item} />
              ))}
              {filteredContent.length === 0 && <p className="text-muted-foreground col-span-full text-center py-12">Noch keine Inhalte</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}