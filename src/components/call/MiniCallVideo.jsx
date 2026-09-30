import React, { useEffect, useRef } from "react";
import { MicOff, VideoOff } from "lucide-react";
import { cn } from "@/lib/utils";

// Ein Bild im Eckfenster — gleich, ob es dein eigenes ist oder das eines anderen.
// Dein eigenes Bild hängt sich über attachRef ein, fremde über ihren Stream.
export default function MiniCallVideo({ stream, attachRef, camOn, micOn, name, contain, overlay, className }) {
  const ownRef = useRef(null);
  const ref = attachRef || ownRef;

  useEffect(() => {
    if (attachRef || !ownRef.current) return;
    if (ownRef.current.srcObject !== stream) ownRef.current.srcObject = stream || null;
  }, [stream, attachRef]);

  return (
    <div className={cn("relative rounded-xl overflow-hidden bg-black border border-border aspect-video", className)}>
      <video
        ref={ref}
        autoPlay
        playsInline
        muted={!!attachRef}
        className={cn("w-full h-full", contain ? "object-contain" : "object-cover")}
      />
      {camOn === false && (
        <div className="absolute inset-0 flex items-center justify-center bg-card">
          <VideoOff className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
      {overlay && <div className="absolute top-1.5 right-1.5 z-10">{overlay}</div>}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-1 px-2 py-1 bg-gradient-to-t from-black/70 to-transparent">
        <span className="text-[10px] text-white truncate">{name}</span>
        {micOn === false && <MicOff className="w-3 h-3 text-white/80 flex-shrink-0" />}
      </div>
    </div>
  );
}