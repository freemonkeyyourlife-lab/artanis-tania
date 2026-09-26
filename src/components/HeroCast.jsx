import React from "react";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

// Wie im Film: Kopf an Kopf, halbtransparent, zur Mitte hin größer.
export default function HeroCast({ creators, centerId }) {
  if (!creators || creators.length === 0) return null;
  const found = creators.findIndex((c) => c.id === centerId);
  const center = found >= 0 ? found : Math.floor(creators.length / 2);

  return (
    <div className="absolute top-0 left-0 right-0 flex items-start justify-center pointer-events-none select-none">
      {creators.map((c, i) => {
        const d = Math.abs(i - center);
        const w = Math.max(76, 230 - d * 28);
        const isCenter = i === center;
        return (
          <Link
            key={c.id}
            to="/messages"
            style={{
              width: `${w}px`,
              height: `${Math.round(w * 1.1)}px`,
              marginLeft: i === 0 ? 0 : `-${Math.round(w * 0.3)}px`,
              zIndex: 50 - d,
            }}
            className={cn(
              "relative flex-shrink-0 pointer-events-auto overflow-hidden rounded-b-[999px] transition-opacity duration-300",
              isCenter ? "opacity-90 hover:opacity-100" : "opacity-35 hover:opacity-70"
            )}
          >
            <Image src={c.avatar} fittingType="fill" focalPointY={0.22} className="w-full h-full" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />
          </Link>
        );
      })}
    </div>
  );
}