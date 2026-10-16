import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import { ArrowRight, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// Alle zehn Sekunden schießt die nächste Karte herein.
const ROTATE_MS = 10000;

// Weiche Ränder: das Bild läuft aus, statt an einer Kante zu enden.
const MASK = "radial-gradient(95% 92% at 50% 46%, #000 46%, transparent 82%)";

export default function HeroNews({ items }) {
  const [index, setIndex] = useState(0);
  const count = items?.length || 0;

  useEffect(() => {
    if (count < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % count), ROTATE_MS);
    return () => clearInterval(timer);
  }, [count]);

  if (!count) return null;
  const item = items[index % count];

  return (
    <div className="relative max-w-xl">
      {/* Nur ein weicher Schatten hinter der Karte — keine harte Kante, kein Rahmen. */}
      <div className="absolute -inset-x-10 -inset-y-6 -z-10 pointer-events-none bg-[radial-gradient(65%_85%_at_32%_50%,hsl(var(--background)/0.85),transparent_72%)]" />

      <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-primary mb-3">
        Was gibt's Neues
      </p>

      {/* Sie rutscht von rechts herein — ohne Rahmen, ohne Kante: das Bild
          läuft weich in die Fläche aus, alles andere steht sauber daneben. */}
      <Link
        key={item.id}
        to={item.to}
        className="animate-hero-slide group flex items-stretch gap-5 pr-4 transition-opacity hover:opacity-90"
      >
        <div
          className="relative w-32 h-44 sm:w-40 sm:h-52 flex-shrink-0"
          style={{ WebkitMaskImage: MASK, maskImage: MASK }}
        >
          <Image src={item.image} fittingType="fill" className="w-full h-full" />
        </div>

        <div className="min-w-0 flex-1 flex flex-col justify-center">
          <span className="inline-flex items-center gap-1.5 self-start px-2.5 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold uppercase tracking-wider">
            <Sparkles className="w-3 h-3" /> {item.kicker}
          </span>
          <h3 className="font-display text-base sm:text-lg text-foreground mt-2 truncate">{item.title}</h3>
          {item.hook && <p className="text-sm font-medium text-primary mt-1">{item.hook}</p>}
          {item.text && <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-2">{item.text}</p>}
          <span className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
            {item.cta} <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </Link>

      {count > 1 && (
        <div className="flex gap-1.5 mt-3">
          {items.map((it, i) => (
            <button
              key={it.id}
              onClick={() => setIndex(i)}
              aria-label="Nächste Meldung"
              className={cn(
                "h-1 rounded-full transition-all",
                i === index % count ? "w-6 bg-primary" : "w-3 bg-border hover:bg-muted-foreground"
              )}
            />
          ))}
        </div>
      )}
    </div>
  );
}