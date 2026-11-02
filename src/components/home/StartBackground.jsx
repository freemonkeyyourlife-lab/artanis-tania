import React, { useEffect, useState } from "react";
import { signMedia } from "@/lib/mediaSign";

// Zeigt die persönlichen Startbilder des Nutzers als sanft wechselndes
// Hintergrundbild hinter der Startseite — zusätzlich zur Hero-Wolke.
// Private Uploads werden vorher signiert.
export default function StartBackground({ images }) {
  const [urls, setUrls] = useState([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    let alive = true;
    if (!images?.length) { setUrls([]); return; }
    Promise.all(images.map((im) => signMedia(im.src))).then((u) => {
      if (alive) setUrls(u.filter(Boolean));
    });
    return () => { alive = false; };
  }, [images]);

  useEffect(() => {
    if (urls.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % urls.length), 7000);
    return () => clearInterval(t);
  }, [urls.length]);

  if (!urls.length) return null;

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {urls.map((u, i) => (
        <div
          key={i}
          className="absolute inset-0 ease-out"
          style={{
            opacity: i === idx ? 0.22 : 0,
            transitionProperty: "opacity",
            transitionDuration: "2200ms",
            backgroundImage: `url(${u})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(3px) saturate(115%)",
          }}
        />
      ))}
      <div className="absolute inset-0 bg-background/55" />
    </div>
  );
}