import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { Image } from "@/components/ui/image";
import StatusBadge from "./StatusBadge";
import { cn } from "@/lib/utils";
import { isFavorite, toggleFavorite } from "@/lib/favorites";

export default function PersonaCard({ creator, className }) {
  const [fav, setFav] = useState(() => isFavorite("creator", creator.id));
  const link = creator.personaType === "COUPLE" ? "/couple" : `/${creator.stageName.toLowerCase().replace(/\s+/g, "")}`;

  const toggle = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const f = toggleFavorite("creator", creator.id);
    setFav(f.includes("creator:" + creator.id));
  };

  return (
    <Link to={link} className={cn("group block", className)}>
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card">
        <div className="aspect-[3/4] relative">
          <Image src={creator.banner || creator.avatar} fittingType="fill" className="w-full h-full transition-transform group-hover:scale-105" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          <div className="absolute top-3 left-3">
            <StatusBadge status={creator.onlineStatus} />
          </div>
          <button
            onClick={toggle}
            title={fav ? "Lesezeichen entfernen" : "Als Lesezeichen merken"}
            className="absolute top-3 right-3 w-8 h-8 rounded-full glass flex items-center justify-center"
          >
            <Heart className={cn("w-4 h-4 transition-colors", fav ? "fill-primary text-primary" : "text-foreground")} />
          </button>
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="font-display text-xl text-foreground">{creator.stageName}</h3>
            <p className="text-sm text-muted-foreground mt-1">{creator.tagline || `${creator.age} y/o`}</p>
          </div>
        </div>
      </div>
    </Link>
  );
}