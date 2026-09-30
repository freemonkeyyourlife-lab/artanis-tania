import React from "react";
import { Image } from "@/components/ui/image";

// V-Form: die Mitte groß und nah, nach außen kleiner, tiefer und schmaler.
// So laufen die Konturen in die Flucht — keine Kante, kein Rahmen, kein Kasten.
const SLOTS = [
  { w: 132, h: 188, drop: 78, rot: 30, z: 11, dim: 0.34 },
  { w: 176, h: 248, drop: 46, rot: 20, z: 15, dim: 0.6 },
  { w: 234, h: 320, drop: 16, rot: 10, z: 20, dim: 0.84 },
  { w: 430, h: 352, drop: 0, rot: 0, z: 30, dim: 1 },
  { w: 234, h: 320, drop: 16, rot: -10, z: 20, dim: 0.84 },
  { w: 176, h: 248, drop: 46, rot: -20, z: 15, dim: 0.6 },
  { w: 132, h: 188, drop: 78, rot: -30, z: 11, dim: 0.34 },
];

// Jede Kante ein bisschen anders — nichts sieht gleichmäßig abgeschnitten aus.
const MIST = [
  "radial-gradient(92% 84% at 50% 48%, #000 20%, transparent 64%)",
  "radial-gradient(96% 88% at 50% 46%, #000 22%, transparent 66%)",
  "radial-gradient(94% 90% at 51% 45%, #000 24%, transparent 68%)",
  "radial-gradient(102% 94% at 50% 47%, #000 28%, transparent 72%)",
  "radial-gradient(95% 87% at 49% 46%, #000 22%, transparent 66%)",
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
    <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-center pointer-events-none select-none overflow-hidden">
      {/* Warmes Licht hinter der Mitte — darin leuchten die Konturen auf. */}
      <div
        className="absolute top-[90px] left-1/2 -translate-x-1/2 w-[720px] h-[420px] blur-3xl"
        style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(226,149,120,0.3), transparent 70%)" }}
      />
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
              marginLeft: i === 0 ? 0 : `-${Math.round(s.w * 0.2)}px`,
              marginTop: `${s.drop}px`,
              zIndex: s.z,
              opacity: s.dim,
              animationDelay: `${i * 0.14}s`,
            }}
          >
            <div
              className="w-full h-full"
              style={{
                transform: `perspective(1500px) rotateY(${s.rot}deg)`,
                transformOrigin: "50% 65%",
                WebkitMaskImage: mask,
                maskImage: mask,
              }}
            >
              <Image
                src={it.src}
                fittingType="fill"
                focalPointY={it.hero ? 0.5 : 0.28}
                className="w-full h-full"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}