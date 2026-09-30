import React from "react";
import { Image } from "@/components/ui/image";

// Fächer: die Mitte groß und klar, nach außen nur etwas kleiner und tiefer.
// Kein Zusammenschieben — jeder bleibt ganz sichtbar.
const SLOTS = [
  { w: 152, h: 212, drop: 74, z: 11, dim: 0.42 },
  { w: 202, h: 282, drop: 42, z: 15, dim: 0.68 },
  { w: 262, h: 352, drop: 14, z: 20, dim: 0.9 },
  { w: 448, h: 400, drop: 0, z: 30, dim: 1 },
  { w: 262, h: 352, drop: 14, z: 20, dim: 0.9 },
  { w: 202, h: 282, drop: 42, z: 15, dim: 0.68 },
  { w: 152, h: 212, drop: 74, z: 11, dim: 0.42 },
];

// Jede Kante ein bisschen anders — nichts sieht gleichmäßig abgeschnitten aus.
const MIST = [
  "radial-gradient(88% 82% at 50% 50%, #000 18%, transparent 62%)",
  "radial-gradient(92% 86% at 50% 48%, #000 20%, transparent 64%)",
  "radial-gradient(90% 88% at 51% 47%, #000 22%, transparent 66%)",
  "radial-gradient(100% 92% at 50% 48%, #000 30%, transparent 74%)",
  "radial-gradient(91% 85% at 49% 48%, #000 20%, transparent 64%)",
];

export default function HeroCloud({ images = [], center }) {
  const mid = Math.ceil(images.length / 2);
  const items = [
    ...images.slice(0, mid).map((src) => ({ src })),
    { src: center, hero: true },
    ...images.slice(mid).map((src) => ({ src })),
  ].filter((it) => it.src);

  if (!items.length) return null;

  return (
    <div className="absolute inset-x-0 top-0 z-10 pointer-events-none select-none overflow-hidden">
      <div className="flex items-start justify-center origin-top scale-[0.5] sm:scale-75 lg:scale-100">
        {items.map((it, i) => {
          const s = SLOTS[i] || SLOTS[SLOTS.length - 1];
          const mask = MIST[i % MIST.length];
          return (
            <div
              key={`${it.src}-${i}`}
              className="relative flex-shrink-0 animate-hero-pop"
              style={{
                width: `${s.w}px`,
                height: `${s.h}px`,
                marginLeft: i === 0 ? 0 : `-${Math.round(s.w * 0.1)}px`,
                marginTop: `${s.drop}px`,
                zIndex: s.z,
                opacity: s.dim,
                animationDelay: `${i * 0.14}s`,
              }}
            >
              {/* Goldener Schimmer — die Figuren leuchten von hinten an. */}
              <div
                className="absolute -inset-8 blur-2xl"
                style={{ background: "radial-gradient(50% 50% at 50% 55%, rgba(226,149,120,0.5), transparent 72%)" }}
              />
              <div
                className="relative w-full h-full"
                style={{ WebkitMaskImage: mask, maskImage: mask }}
              >
                <Image
                  src={it.src}
                  fittingType="fill"
                  focalPointY={it.hero ? 0.45 : 0.28}
                  className="w-full h-full"
                />
              </div>
            </div>
          );
        })}
      </div>
      {/* Glänzende Glasoptik darüber — ein weicher Schimmer, keine Kante. */}
      <div
        className="absolute inset-0"
        style={{ background: "linear-gradient(112deg, transparent 24%, rgba(255,255,255,0.07) 40%, rgba(255,255,255,0.02) 56%, transparent 72%)" }}
      />
    </div>
  );
}