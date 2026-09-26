import React, { useEffect, useRef } from "react";
import { MicOff, VideoOff } from "lucide-react";
import { cn } from "@/lib/utils";

function TileName({ name, micOn }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 px-3 py-2 bg-gradient-to-t from-black/70 to-transparent">
      <span className="text-xs text-white truncate">{name}</span>
      {!micOn && <MicOff className="w-3.5 h-3.5 text-white/80 flex-shrink-0" />}
    </div>
  );
}

function PeerTile({ peer }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && ref.current.srcObject !== peer.stream) {
      ref.current.srcObject = peer.stream || null;
    }
  }, [peer.stream]);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-card border border-border aspect-video">
      <video ref={ref} autoPlay playsInline className="w-full h-full object-cover" />
      {!peer.cam && (
        <div className="absolute inset-0 flex items-center justify-center bg-card">
          <VideoOff className="w-6 h-6 text-muted-foreground" />
        </div>
      )}
      <TileName name={peer.name || `Gast ${peer.seat}`} micOn={peer.mic} />
    </div>
  );
}

export default function CallStage({ localVideoRef, camOn, micOn, myName, peers }) {
  return (
    <div className={cn("flex-1 overflow-y-auto p-3 sm:p-4", peers.length === 0 && "flex items-center justify-center")}>
      <div className={cn("grid gap-3 w-full", peers.length === 0 ? "max-w-xl" : "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3")}>
        {peers.map((peer) => (
          <PeerTile key={peer.seat} peer={peer} />
        ))}

        <div className="relative rounded-2xl overflow-hidden bg-card border border-border aspect-video">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          {!camOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-card">
              <VideoOff className="w-6 h-6 text-muted-foreground" />
            </div>
          )}
          <TileName name={`${myName} (du)`} micOn={micOn} />
        </div>
      </div>
    </div>
  );
}