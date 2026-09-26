import React from "react";
import { Heart, Star, Play } from "lucide-react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

export default function PostCard({ post, currentUserId, onLike, onRate }) {
  const liked = post.likedBy?.includes(currentUserId);
  const myRating = post.ratedBy?.[currentUserId] || 0;
  const avg = post.ratingCount ? post.ratingSum / post.ratingCount : 0;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden flex flex-col">
      <div className="relative aspect-[3/4] bg-elevated">
        {post.mediaType === "VIDEO" ? (
          <video src={post.mediaUrl} controls playsInline className="w-full h-full object-cover" />
        ) : (
          <Image src={post.mediaUrl} fittingType="fill" className="w-full h-full" />
        )}
        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full glass text-[10px] font-semibold uppercase text-foreground">
          {post.mediaType === "VIDEO" ? <span className="inline-flex items-center gap-1"><Play className="w-3 h-3" /> Video</span> : "Bild"}
        </span>
      </div>

      <div className="p-3 flex flex-col flex-1">
        {post.title && <p className="text-sm font-medium text-foreground truncate">{post.title}</p>}
        <p className="text-xs text-muted-foreground truncate">{post.anonymous ? "anonym" : `von ${post.userName || "Unbekannt"}`}</p>
        {post.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{post.description}</p>}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <button
            onClick={() => onLike(post)}
            className={cn("inline-flex items-center gap-1.5 text-xs font-medium transition-colors", liked ? "text-primary" : "text-muted-foreground hover:text-foreground")}
          >
            <Heart className={cn("w-4 h-4", liked && "fill-current")} />
            {post.likes || 0}
          </button>

          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} onClick={() => onRate(post, n)} title={`${n} Sterne`} className="transition-transform hover:scale-110">
                <Star className={cn("w-4 h-4", n <= (myRating || Math.round(avg)) ? "text-primary fill-current" : "text-muted-foreground/40")} />
              </button>
            ))}
            <span className="text-[11px] text-muted-foreground ml-1">{avg ? avg.toFixed(1) : "–"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}