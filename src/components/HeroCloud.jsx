import React from "react";
import { Image } from "@/components/ui/image";

// Die Wolke oben: das Banner in der Mitte, die Porträts drumherum.
// Kein gerader Abschluss — die Ränder lösen sich wie Nebel auf.
const PORTRAIT = { w: 236, h: 318 };
const BANNER = { w: 400, h: 300 };

// Jede Kante ein bisschen anders, damit nichts gleichmäßig abgeschnitten aussieht.
const MIST = [
  "radial-gradient(122% 104% at 48% 33%, #000 44%, transparent 84%)",
  "radial-gradient(128% 108% at 53% 29%, #000 48%, transparent 88%)",
  "radial-gradient(118% 114% at 50% 41%, #000 46%, transparent 86%)",
  "radial-gradient(126% 106% at 46% 31%, #000 43%, transparent 82%)",
  "radial-gradient(120% 102% at 54% 36%, #000 40%, transparent 80%)",
];

const DROP = [24, 8, 0, 12, 28];

export default function HeroCloud({ images }) {
  if (!images?.length) return null;
  const mid = Math.floor(images.length / 2);

  return (
    <div className="absolute inset-x-0 top-0 flex items-start justify-center pointer-events-none select-none overflow-hidden">
      {images.map((src, i) => {
        const isBanner = i === mid;
        const size = isBanner ? BANNER : PORTRAIT;
        const mask = MIST[i % MIST.length];
        return (
          <div
            key={`${src}-${i}`}
            style={{
              width: `${size.w}px`,
              height: `${size.h}px`,
              marginLeft: i === 0 ? 0 : isBanner || i === mid + 1 ? "-36px" : "-26px",
              marginTop: `${DROP[i % DROP.length]}px`,
              zIndex: isBanner ? 24 : 20 - Math.abs(i - mid),
              WebkitMaskImage: mask,
              maskImage: mask,
            }}
            className="relative flex-shrink-0"
          >
            <Image
              src={src}
              fittingType="fill"
              focalPointY={isBanner ? 0.45 : 0.25}
              className="w-full h-full"
            />
          </div>
        );
      })}
    </div>
  );
}