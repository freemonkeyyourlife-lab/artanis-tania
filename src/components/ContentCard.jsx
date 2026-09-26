import React, { useState } from "react";
import { Image } from "@/components/ui/image";
import { Heart, Lock, Play, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { isFavorite, toggleFavorite } from "@/lib/favorites";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const VISIBILITY_CONFIG = {
  PUBLIC: { label: "FREE", icon: null, color: "text-emerald-400" },
  FREE_MEMBER: { label: "FREE", icon: null, color: "text-emerald-400" },
  REGISTERED: { label: "FREE", icon: null, color: "text-emerald-400" },
  VIP: { label: "VIP", icon: Crown, color: "text-amber-400" },
  PPV: { label: "PPV", icon: Lock, color: "text-primary" },
  INVITE_ONLY: { label: "INVITE", icon: Lock, color: "text-violet-400" },
  PRIVATE: { label: "PRIVATE", icon: Lock, color: "text-red-400" },
  UNLISTED: { label: "UNLISTED", icon: Lock, color: "text-muted-foreground" },
};

export default function ContentCard({ content, className }) {
  const [fav, setFav] = useState(() => isFavorite("content", content.id));
  const [open, setOpen] = useState(false);
  const vis = VISIBILITY_CONFIG[content.visibility] || VISIBILITY_CONFIG.PUBLIC;
  const VisIcon = vis.icon;
  const isVideo = content.contentType === "VIDEO" || content.contentType === "VIDEO_SET";
  const mediaUrl = content.fullAsset || content.previewAsset || content.thumbnail;

  return (
    <div className={cn("group cursor-pointer", className)}>
      <div onClick={() => setOpen(true)} className="relative overflow-hidden rounded-2xl border border-border bg-card aspect-video">
        {content.thumbnail ? (
          <Image src={content.thumbnail} fittingType="fill" className="w-full h-full transition-transform group-hover:scale-105" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-elevated to-card" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full glass-strong flex items-center justify-center">
              <Play className="w-5 h-5 text-foreground ml-0.5" fill="currentColor" />
            </div>
          </div>
        )}
        <div className="absolute top-2 right-2">
          {VisIcon ? (
            <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold glass", vis.color)}>
              <VisIcon className="w-3 h-3" />
              {vis.label}
            </span>
          ) : (
            <span className={cn("inline-flex items-center px-2 py-1 rounded-full text-[11px] font-semibold glass", vis.color)}>
              {vis.label}
            </span>
          )}
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); const f = toggleFavorite("content", content.id); setFav(f.includes("content:" + content.id)); }}
          className="absolute top-2 left-2 w-8 h-8 rounded-full glass flex items-center justify-center"
        >
          <Heart className={cn("w-4 h-4 transition-colors", fav ? "fill-primary text-primary" : "text-foreground")} />
        </button>
        {content.duration && (
          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full text-[11px] font-medium glass text-foreground">
            {Math.floor(content.duration / 60)}:{String(content.duration % 60).padStart(2, '0')}
          </span>
        )}
      </div>
      <div className="mt-2 px-1">
        <h4 className="text-sm font-medium text-foreground truncate">{content.title}</h4>
        <p className="text-xs text-muted-foreground mt-0.5">{content.creatorName}</p>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl p-0 border-0 bg-background/95 overflow-hidden">
          {isVideo && mediaUrl ? (
            <video src={mediaUrl} controls autoPlay playsInline poster={content.thumbnail} className="w-full max-h-[80vh] rounded-lg bg-black" />
          ) : mediaUrl ? (
            <img src={mediaUrl} alt={content.title} className="w-full max-h-[80vh] object-contain rounded-lg" />
          ) : (
            <p className="p-6 text-sm text-muted-foreground">Für diesen Beitrag ist noch keine Datei hinterlegt.</p>
          )}
          <div className="px-4 pb-4 pt-3">
            <h3 className="font-display text-lg text-foreground">{content.title}</h3>
            <p className="text-xs text-muted-foreground mb-2">{content.creatorName}</p>
            {content.description && <p className="text-sm text-muted-foreground">{content.description}</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}