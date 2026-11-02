import React, { useState } from "react";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { isFavorite, toggleFavorite } from "@/lib/favorites";
import ReadAloudButton from "@/components/ReadAloudButton";

// Story-Karte mit Lesezeichen (Heart) und Vorleser — wie bei den Content-Karten.
export default function StoryCard({ story }) {
  const [fav, setFav] = useState(() => isFavorite("story", story.id));
  const text = story.preview || story.content || "";

  return (
    <div className="p-5 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-display text-lg text-foreground">{story.title}</h3>
        <button
          onClick={() => { const f = toggleFavorite("story", story.id); setFav(f.includes("story:" + story.id)); }}
          title={fav ? "Lesezeichen entfernen" : "Als Lesezeichen merken"}
          className="w-8 h-8 rounded-full glass flex items-center justify-center flex-shrink-0"
        >
          <Heart className={cn("w-4 h-4 transition-colors", fav ? "fill-primary text-primary" : "text-foreground")} />
        </button>
      </div>
      <p className="text-sm text-muted-foreground mt-2 line-clamp-3">{text}</p>
      <div className="flex items-center justify-between gap-2 mt-3">
        {story.series ? (
          <p className="text-xs text-primary">{story.series} · Ep. {story.episode || 1}</p>
        ) : <span />}
        <ReadAloudButton text={text} />
      </div>
    </div>
  );
}