import React from "react";
import { ExternalLink, CalendarClock } from "lucide-react";
import { Image } from "@/components/ui/image";

const PLATFORM_LABEL = {
  STRIPCHAT: "Stripchat",
  CHATURBATE: "Chaturbate",
  CAM4: "CAM4",
  BONGACAMS: "BongaCams",
  MYFREECAMS: "MyFreeCams",
  ANDERE: "Extern",
};

export default function LiveStreamBanner({ stream }) {
  const isLive = stream.status === "LIVE";
  const platform = PLATFORM_LABEL[stream.platform] || stream.platform;
  const embed = isLive && stream.embedUrl ? stream.embedUrl : null;

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {embed ? (
        <div className="relative aspect-video bg-black">
          <iframe
            src={embed}
            title={stream.title}
            className="w-full h-full"
            allow="autoplay; fullscreen; encrypted-media; picture-in-picture"
            allowFullScreen
          />
          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/90 text-white text-[11px] font-semibold tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> Live
          </span>
        </div>
      ) : (
        <div className="relative aspect-video bg-elevated">
          {stream.thumbnail ? (
            <Image src={stream.thumbnail} fittingType="fill" className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center font-display text-4xl text-primary/40">
              {platform[0]}
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent" />
          <span className={`absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase ${isLive ? "bg-red-500/90 text-white" : "glass text-foreground"}`}>
            {isLive && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
            {isLive ? "Live" : "Geplant"}
          </span>
        </div>
      )}

      <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h3 className="font-display text-lg text-foreground">{stream.title}</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isLive ? `Jetzt live auf ${platform}` : `Geplant auf ${platform}`}
            {!isLive && stream.startsAt && (
              <span className="inline-flex items-center gap-1.5 ml-2">
                <CalendarClock className="w-3.5 h-3.5" />
                {new Date(stream.startsAt).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}
              </span>
            )}
          </p>
          {stream.description && <p className="text-sm text-muted-foreground mt-1">{stream.description}</p>}
        </div>
        {stream.roomUrl && (
          <a
            href={stream.roomUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-medium whitespace-nowrap flex-shrink-0"
          >
            <ExternalLink className="w-4 h-4" />
            {isLive ? `Auf ${platform} zuschauen` : "Raum öffnen"}
          </a>
        )}
      </div>
    </div>
  );
}