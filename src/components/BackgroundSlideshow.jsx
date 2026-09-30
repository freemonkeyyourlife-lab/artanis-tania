import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";

const ROTATE_MS = 9000;
const MAX_IMAGES = 12;

// Im Hintergrund läuft ruhig durch, was die Plattform ausmacht — Charaktere,
// Wettbewerbe, was Nutzer hochgeladen haben. Nur auf der Besitzer-Konsole nicht:
// dort muss man arbeiten können.
export default function BackgroundSlideshow() {
  const { pathname } = useLocation();
  const [images, setImages] = useState([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [creators, contests, posts] = await Promise.all([
          base44.entities.Creator.list("-updated_date", 20),
          base44.entities.Contest.list("-updated_date", 10),
          base44.entities.UserPost.list("-created_date", 10),
        ]);
        const pool = [
          ...creators.flatMap((c) => [c.banner, c.avatar, ...(c.referenceImages || [])]),
          ...contests.map((c) => c.coverImage),
          ...posts.flatMap((p) => [p.mediaUrl, p.thumbnail]),
        ].filter((url) => typeof url === "string" && url.startsWith("http"));
        const unique = [...new Set(pool)].slice(0, MAX_IMAGES);
        if (alive) setImages(unique);
      } catch (e) {
        // Ohne Bilder bleibt der Hintergrund einfach ruhig.
      }
    })();
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (images.length < 2) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % images.length), ROTATE_MS);
    return () => clearInterval(timer);
  }, [images.length]);

  if (pathname === "/owner" || images.length === 0) return null;

  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {images.map((src, i) => (
        <Image
          key={src}
          src={src}
          fittingType="fill"
          className="absolute inset-0 w-full h-full transition-opacity ease-in-out"
          style={{ opacity: i === index ? 0.28 : 0, transitionDuration: "2500ms" }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/85 to-background/95" />
    </div>
  );
}