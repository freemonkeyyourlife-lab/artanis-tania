import React from "react";
import { Image } from "@/components/ui/image";

// Wie in einer Wolke: alle nebeneinander, ungefähr gleich groß,
// unten weich ins Schwarz auslaufend — die Schrift steht davor.
const SIZES = [230, 248, 258, 248, 230];

export default function HeroCloud({ images }) {
  if (!images?.length) return null;
  const mid = Math.floor(images.length / 2);

  return (
    <div className="absolute inset-x-0 top-0 flex items-start justify-center pointer-events-none select-none overflow-hidden">
      {images.map((src, i) => {
        const w = SIZES[i % SIZES.length];
        const h = Math.round(w * 1.35);
        return (
          <div
            key={`${src}-${i}`}
            style={{
              width: `${w}px`,
              height: `${h}px`,
              marginLeft: i === 0 ? 0 : "-28px",
              zIndex: 20 - Math.abs(i - mid),
            }}
            className="relative flex-shrink-0 overflow-hidden rounded-b-[140px]"
          >
            <Image src={src} fittingType="fill" focalPointY={0.2} className="w-full h-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
          </div>
        );
      })}
    </div>
  );
}