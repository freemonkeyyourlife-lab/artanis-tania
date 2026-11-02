import React, { useState } from "react";
import { BookOpen, ChevronDown, ChevronUp, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { isFavorite, toggleFavorite } from "@/lib/favorites";
import ReadAloudButton from "@/components/ReadAloudButton";

// Eine Story-Zeile mit Lesezeichen und Vorleser — aufklappbar.
export default function StoryListRow({ story, highlight }) {
  const [expanded, setExpanded] = useState(false);
  const [fav, setFav] = useState(() => isFavorite("story", story.id));
  const text = story.preview || story.content || "";

  const toggle = (e) => {
    e.stopPropagation();
    const f = toggleFavorite("story", story.id);
    setFav(f.includes("story:" + story.id));
  };

  return (
    <div className={cn("rounded-2xl border bg-card overflow-hidden", highlight ? "border-primary" : "border-border")}>
      <div className="w-full p-5 text-left flex items-start justify-between gap-4">
        <button onClick={() => setExpanded(x => !x)} className="flex-1 text-left">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-primary" />
            {story.series && <span className="text-xs text-primary">{story.series} · Ep. {story.episode || 1}</span>}
          </div>
          <h3 className="font-display text-xl text-foreground">{story.title}</h3>
          <p className="text-sm text-muted-foreground mt-1">{story.creatorName}</p>
          <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{text}</p>
          {story.topics?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {story.topics.map((t, i) => <span key={i} className="px-2 py-0.5 rounded-full glass text-[11px] text-muted-foreground">{t}</span>)}
            </div>
          )}
        </button>
        <div className="flex flex-col items-center gap-2 flex-shrink-0">
          <button onClick={toggle} title={fav ? "Lesezeichen entfernen" : "Als Lesezeichen merken"} className="w-8 h-8 rounded-full glass flex items-center justify-center">
            <Heart className={cn("w-4 h-4 transition-colors", fav ? "fill-primary text-primary" : "text-foreground")} />
          </button>
          <ReadAloudButton text={text} />
          {expanded ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
        </div>
      </div>
      {expanded && (
        <div className="px-5 pb-5 border-t border-border pt-4">
          <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{story.content}</p>
        </div>
      )}
    </div>
  );
}