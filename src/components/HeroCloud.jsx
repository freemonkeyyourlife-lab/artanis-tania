import React from "react";
import { Image } from "@/components/ui/image";

// Die Wolke oben: das Banner in der Mitte, die Porträts drumherum.
// Kein gerader Abschluss — die Ränder lösen sich wie Nebel auf.
const PORTRAIT = { w: 236, h: 318 };
const BANNER = { w: 400, h: 300 };

// Jede Kante ein bisschen anders, damit nichts gleichmäßig abgeschnitten aussieht.
const MIST = [
  "radial-gradient(115% 100% at 50% 38%, #000 42%, transparent 78%)",
  "radial-gradient(120% 104% at 52% 34%, #000 44%, transparent 80%)",
  "radial-gradient(112% 108% at 49% 42%, #000 42%, transparent 78%)",
  "radial-gradient(118% 102% at 47% 36%, #000 40%, transparent 76%)",
  "radial-gradient(114% 100% at 53% 39%, #000 40%, transparent 76%)",
];

const DROP = [24, 8, 0, 12, 28];

export default function HeroCloud({ images }) {
  if (!images?.length) return null;
  const mid = Math.floor(images.length / 2);

  return (
    <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-center pointer-events-none select-none overflow-hidden">
      {images.map((src, i) => {
        const isBanner = i === mid;
        const size = isBanner ? BANNER : PORTRAIT;
        const mask = MIST[i % MIST.length];
        const distance = Math.abs(i - mid);
        return (
          <div
            key={`${src}-${i}`}
            className="relative flex-shrink-0 animate-hero-pop"
            style={{
              width: `${size.w}px`,
              height: `${size.h}px`,
              marginLeft: i === 0 ? 0 : isBanner || i === mid + 1 ? "-36px" : "-26px",
              marginTop: `${DROP[i % DROP.length]}px`,
              zIndex: isBanner ? 24 : 20 - distance,
              // Je weiter außen, desto blasser — bis sie im Hintergrund verschwinden.
              opacity: 1 - distance * 0.14,
              animationDelay: `${i * 0.14}s`,
              WebkitMaskImage: mask,
              maskImage: mask,
            }}
          >
            <Image
              src={src}
              fittingType="fill"
              focalPointY={isBanner ? 0.45 : 0.25}
              className="w-full h-full rounded-[28px]"
            />
          </div>
        );
      })}
    </div>
  );
}