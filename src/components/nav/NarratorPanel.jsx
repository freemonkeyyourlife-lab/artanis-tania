import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Mic } from "lucide-react";

// Die Erzählerin in groß: volle Breite der Leiste und die restliche Höhe
// darunter. Sie ist immer da — hier steht sie, statt nur zu sprechen.
export default function NarratorPanel() {
  const [narrator, setNarrator] = useState(null);

  useEffect(() => {
    base44.entities.Narrator.filter({ active: { $ne: false } }, "order", 1)
      .then((res) => setNarrator(res?.items?.[0] || null))
      .catch(() => setNarrator(null));
  }, []);

  const name = narrator?.name?.trim() || "Die Erzählerin";

  return (
    <Link
      to="/erzaehler"
      title="Erzählerin anlegen & ändern"
      className="relative flex-1 min-h-[180px] mx-3 mb-3 rounded-3xl overflow-hidden group"
    >
      {narrator?.avatar ? (
        <Image
          src={narrator.avatar}
          fittingType="fill"
          className="absolute inset-0 w-full h-full transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center bg-elevated font-display text-5xl text-primary">
          {name.slice(0, 1)}
        </span>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/35 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-3">
        <p className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-primary">
          <Mic className="w-3.5 h-3.5" /> Erzählerin
        </p>
        <p className="font-display text-lg text-foreground truncate text-gloss">{name}</p>
      </div>
    </Link>
  );
}