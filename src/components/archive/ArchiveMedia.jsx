import React from "react";
import { Lock } from "lucide-react";
import { Image } from "@/components/ui/image";
import DownloadButton from "@/components/DownloadButton";

// Ein Medien-Anhang im Archiv: Bild, Video oder Stimme. Was der Gast nie
// freigeschaltet hat, bleibt auch hier verhüllt.
export default function ArchiveMedia({ item }) {
  if (!item) return null;

  if (item.locked) {
    return (
      <div className="relative w-52 h-52 rounded-2xl overflow-hidden bg-black">
        {item.type === "image" && (
          <Image src={item.url} fittingType="fill" className="w-full h-full blur-2xl scale-110" />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/60 px-2 text-center">
          <Lock className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-semibold uppercase tracking-wide text-primary">{item.label || "verschlossen"}</span>
          {item.price ? <span className="text-xs font-semibold text-foreground">{item.price} €</span> : null}
        </div>
      </div>
    );
  }

  if (item.type === "video") {
    return (
      <div>
        <video src={item.url} controls playsInline className="w-72 max-w-full rounded-2xl" />
        <div className="mt-1.5">
          <DownloadButton url={item.url} filename="video.mp4" />
        </div>
      </div>
    );
  }

  if (item.type === "audio") {
    return <audio src={item.url} controls className="w-72 max-w-full" />;
  }

  if (item.type === "reshoot") {
    return (
      <p className="text-[11px] italic text-muted-foreground">
        Nicht gezeigt: {item.note || "Inhalt blockiert"}
      </p>
    );
  }

  if (!item.url) return null;

  return (
    <div className="relative w-52 h-52 rounded-2xl overflow-hidden bg-elevated">
      <Image src={item.url} fittingType="fill" className="w-full h-full" />
      <DownloadButton url={item.url} filename="bild.jpg" className="absolute bottom-2 left-2" />
    </div>
  );
}