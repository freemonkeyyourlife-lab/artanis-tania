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
        <p className="text-muted-foreground">Creator not found</p>
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

      {/* Banner */}
      <div className="relative h-[40vh] min-h-[300px] w-full overflow-hidden">
        {/* Weichgezeichneter Hintergrund füllt die Fläche, das Bild selbst steht komplett drin — der Kopf ist immer zu sehen. */}
        <Image src={creator.banner || creator.avatar} fittingType="fill" className="absolute inset-0 w-full h-full scale-125 blur-2xl opacity-70" />
        <Image src={creator.banner || creator.avatar} fittingType="fit" className="absolute inset-0 w-full h-full" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute top-4 left-4">
          <StatusBadge status={creator.onlineStatus} />
        </div>
      </div>

      {/* Profile Info */}
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 -mt-20 relative z-10">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          <div className="w-28 h-28 lg:w-36 lg:h-36 rounded-2xl overflow-hidden border-2 border-border bg-card flex-shrink-0">
            {/* Ausschnitt nach oben gezogen — im Rahmen sitzt das Gesicht, nicht der Bauch. */}
            <Image src={creator.avatar} fittingType="fill" focalPointX={0.5} focalPointY={0.1} className="w-full h-full" />
          </div>
          <div className="flex-1 pt-2 lg:pt-16">
            <h1 className="font-display text-3xl lg:text-4xl text-foreground">{creator.stageName}</h1>
            <p className="text-muted-foreground mt-1">
              {creator.age ? `${creator.age} years old` : "Couple Persona"}
              {creator.personaType === "SOLO_MALE" && " · Male"}
              {creator.personaType === "SOLO_FEMALE" && " · Female"}
            </p>
            {creator.tagline && <p className="text-primary text-sm mt-2">{creator.tagline}</p>}
            <p className="text-sm text-muted-foreground mt-3 max-w-2xl">{creator.bio}</p>

            <div className="flex flex-wrap gap-3 mt-5">
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

            <div className="flex gap-6 mt-5">
              <div>
                <p className="text-xl font-display text-foreground">{creator.stats_followers || 0}</p>
                <p className="text-xs text-muted-foreground">Followers</p>
              </div>
              <div>
                <p className="text-xl font-display text-foreground">{content.length}</p>
                <p className="text-xs text-muted-foreground">Content</p>
              </div>
              <div>
                <p className="text-xl font-display text-foreground">{stories.length}</p>
                <p className="text-xs text-muted-foreground">Stories</p>
              </div>
            </div>
          </div>
        </div>

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
            { id: "all", label: "All" },
            { id: "video", label: "Videos" },
            { id: "photo", label: "Photos" },
            { id: "story", label: "Stories" },
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
              {stories.length === 0 && <p className="text-muted-foreground col-span-2 text-center py-12">No stories yet</p>}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredContent.map((item) => (
                <ContentCard key={item.id} content={item} />
              ))}
              {filteredContent.length === 0 && <p className="text-muted-foreground col-span-full text-center py-12">No content yet</p>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}