import React from "react";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";

// Bleibt stehen, solange du schreibst — das große Bild der Figur, mit der du
// gerade redest. Damit sie immer sofort da ist, nicht nur als kleiner Kreis
// oben in der Kopfzeile. Nur auf dem Desktop; auf dem Handy bleibt der Chat
// allein, damit nichts gequetscht wird.
export default function ChatCharacterSidebar({ creator }) {
  if (!creator) return null;
  const avatar = creator.avatar;
  const name = creator.stageName || "Figur";
  const isReal = creator.creatorCategory === "REAL";

  return (
    <aside className="hidden lg:flex flex-col w-60 xl:w-72 flex-shrink-0 rounded-3xl border-2 border-border bg-card overflow-hidden">
      <Link to={`/creator/${creator.id}`} className="block group">
        <div className="relative aspect-[3/4] bg-elevated overflow-hidden">
          {avatar ? (
            <Image
              src={avatar}
              fittingType="fill"
              className="w-full h-full transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-display text-6xl text-primary">
              {name[0]}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
        </div>
      </Link>

      <div className="p-4 flex flex-col gap-2">
        <Link
          to={`/creator/${creator.id}`}
          className="font-display text-xl text-foreground leading-tight hover:text-primary transition-colors"
        >
          {name}
        </Link>
        <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
          {isReal ? "Real · KI-Persona" : "KI-Modell"}
        </span>
        {creator.tagline ? (
          <p className="text-[13px] font-semibold text-muted-foreground leading-relaxed line-clamp-3">
            {creator.tagline}
          </p>
        ) : creator.bio ? (
          <p className="text-[13px] font-semibold text-muted-foreground leading-relaxed line-clamp-4">
            {creator.bio}
          </p>
        ) : null}
      </div>
    </aside>
  );
}