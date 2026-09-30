import React from "react";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";

// Fächer: die Mitte groß, nach außen etwas kleiner — aber alle klar sichtbar.
const SLOTS = [
  { w: 220, h: 300, drop: 40, z: 12, dim: 0.85 },
  { w: 250, h: 330, drop: 22, z: 16, dim: 0.92 },
  { w: 280, h: 360, drop: 8, z: 20, dim: 1 },
  { w: 460, h: 410, drop: 0, z: 30, dim: 1 },
  { w: 280, h: 360, drop: 8, z: 20, dim: 1 },
  { w: 250, h: 330, drop: 22, z: 16, dim: 0.92 },
  { w: 220, h: 300, drop: 40, z: 12, dim: 0.85 },
];

// Weiche Ränder: Gesicht und Haare bleiben frei, nur die Außenkante verläuft.
const MASK = "radial-gradient(95% 92% at 50% 44%, #000 42%, transparent 80%)";

export default function HeroCloud({ items = [] }) {
  if (!items.length) return null;

  return (
    <div className="absolute inset-x-0 top-0 z-[25] pointer-events-none select-none overflow-hidden">
      <div className="flex items-start justify-center origin-top scale-[0.45] sm:scale-75 lg:scale-100">
        {items.map((it, i) => {
          const s = SLOTS[i] || SLOTS[SLOTS.length - 1];
          return (
            <Link
              key={`${it.src}-${i}`}
              to={it.to || "/explore"}
              className="group relative flex-shrink-0 animate-hero-pop pointer-events-auto hover:!opacity-100 transition-opacity"
              style={{
                width: `${s.w}px`,
                height: `${s.h}px`,
                marginLeft: i === 0 ? 0 : `-${Math.round(s.w * 0.06)}px`,
                marginTop: `${s.drop}px`,
                zIndex: s.z,
                opacity: s.dim,
                animationDelay: `${i * 0.14}s`,
              }}
            >
              {/* Goldener Schimmer — die Figuren leuchten von hinten an. */}
              <div
                className="absolute -inset-8 blur-2xl opacity-70 group-hover:opacity-100 transition-opacity"
                style={{ background: "radial-gradient(50% 50% at 50% 50%, rgba(226,149,120,0.55), transparent 72%)" }}
              />
              <div className="relative w-full h-full" style={{ WebkitMaskImage: MASK, maskImage: MASK }}>
                <Image src={it.src} fittingType="fill" focalPointY={0.3} className="w-full h-full" />
                <div
                  className="absolute inset-0"
                  style={{ background: "linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.12) 44%, rgba(255,255,255,0.03) 56%, transparent 70%)" }}
                />
              </div>
              {(it.title || it.text) && (
                <div className="absolute left-1/2 bottom-6 -translate-x-1/2 w-[85%] opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 glass-btn rounded-2xl px-4 py-3 text-center">
                  <p className="text-sm font-bold text-foreground text-gloss">{it.title}</p>
                  {it.text && <p className="text-xs font-semibold text-foreground/80 mt-0.5">{it.text}</p>}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}