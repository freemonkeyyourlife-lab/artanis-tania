import React, { useEffect, useRef } from "react";
import { MicOff, VideoOff, MonitorPlay } from "lucide-react";
import { cn } from "@/lib/utils";
import PipButton from "@/components/call/PipButton";
import { STAGE_SPLITS } from "@/lib/callWindows";

function TileName({ name, micOn }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 px-3 py-2 bg-gradient-to-t from-black/70 to-transparent">
      <span className="text-xs text-white truncate">{name}</span>
      {!micOn && <MicOff className="w-3.5 h-3.5 text-white/80 flex-shrink-0" />}
    </div>
  );
}

// Kamera und geteilter Bildschirm laufen gleichzeitig — jedes Bild hat seinen
// eigenen Platz, damit keines das andere verdrängt.
function StreamVideo({ stream, fit }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current && ref.current.srcObject !== stream) ref.current.srcObject = stream || null;
  }, [stream]);
  return (
    <video
      ref={ref}
      autoPlay
      playsInline
      muted
      className={cn("w-full h-full", fit === "contain" ? "object-contain" : "object-cover")}
    />
  );
}

function PeerTile({ peer, className, style }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current && ref.current.srcObject !== peer.stream) {
      ref.current.srcObject = peer.stream || null;
    }
  }, [peer.stream]);

  return (
    <div className={cn("relative rounded-2xl overflow-hidden bg-card border border-border", className)} style={style}>
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

function LocalTile({ localVideoRef, camOn, micOn, myName, getVideo, className, style }) {
  return (
    <div className={cn("relative rounded-2xl overflow-hidden bg-card border border-border", className)} style={style}>
      <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
      {!camOn && (
        <div className="absolute inset-0 flex items-center justify-center bg-card">
          <VideoOff className="w-6 h-6 text-muted-foreground" />
        </div>
      )}
      {getVideo && (
        <div className="absolute top-2 right-2 z-10">
          <PipButton getVideo={getVideo} />
        </div>
      )}
      <TileName name={`${myName} (du)`} micOn={micOn} />
    </div>
  );
}

export default function CallStage({ localVideoRef, camOn, micOn, myName, peers, getVideo, myScreen, split, onSplit }) {
  // Zeigt gerade jemand etwas? Dann steht der Bildschirm groß und die Gesichter
  // bleiben daneben stehen — niemand fliegt aus dem Bild.
  const sharer = peers.find((p) => p.sharing && p.screen) || null;
  const screenStream = myScreen || sharer?.screen || null;
  const splitValue = STAGE_SPLITS.find((s) => s.id === split)?.value ?? 38;
  const stripStyle = { flex: `0 0 ${splitValue}%` };
  const tileStyle = { height: "100%", aspectRatio: "16 / 9", flex: "0 0 auto" };

  if (screenStream) {
    return (
      <div className="flex-1 min-w-0 min-h-0 flex flex-col">
        <div className="relative flex-1 min-h-0 flex items-center justify-center bg-black overflow-hidden">
          <StreamVideo stream={screenStream} fit="contain" />
          <div className="absolute bottom-0 left-0 right-0 flex items-center gap-2 px-3 py-2 bg-gradient-to-t from-black/70 to-transparent pointer-events-none">
            <MonitorPlay className="w-3.5 h-3.5 text-white/80 flex-shrink-0" />
            <span className="text-xs text-white truncate">
              {myScreen ? `${myName} (du)` : sharer?.name || `Gast ${sharer?.seat}`} teilt den Bildschirm
            </span>
          </div>
          {onSplit && (
            <div className="absolute top-2 right-2 flex items-center gap-1 p-1 rounded-full bg-black/55 backdrop-blur">
              <span className="px-2 text-[11px] font-semibold text-white/60">Gesichter</span>
              {STAGE_SPLITS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => onSplit(s.id)}
                  title={`Gesichter ${s.label} — der geteilte Bildschirm bleibt sichtbar`}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors",
                    split === s.id ? "bg-primary text-primary-foreground" : "text-white/80 hover:text-white"
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div
          className="min-h-0 p-2 sm:p-3 flex gap-2 overflow-x-auto scrollbar-hide border-t border-border"
          style={stripStyle}
        >
          {peers.map((peer) => (
            <PeerTile key={peer.seat} peer={peer} style={tileStyle} />
          ))}
          <LocalTile
            localVideoRef={localVideoRef}
            camOn={camOn}
            micOn={micOn}
            myName={myName}
            getVideo={getVideo}
            style={tileStyle}
          />
        </div>
      </div>
    );
  }

  const count = peers.length + 1;
  // Wenige Leute groß, viele Leute kompakt — derselbe Raum trägt jede Gruppengröße.
  const layout = count <= 2
    ? "grid-cols-1 sm:grid-cols-2"
    : count <= 4
    ? "grid-cols-1 sm:grid-cols-2 xl:grid-cols-3"
    : "grid-cols-2 lg:grid-cols-3 xl:grid-cols-4";

  return (
    <div className={cn("flex-1 min-w-0 min-h-0 overflow-y-auto p-3 sm:p-4", peers.length === 0 && "flex items-center justify-center")}>
      <div className={cn("grid gap-3 w-full content-start", peers.length === 0 ? "max-w-xl" : layout)}>
        {peers.map((peer) => (
          <PeerTile key={peer.seat} peer={peer} className="aspect-video" />
        ))}

        <LocalTile
          localVideoRef={localVideoRef}
          camOn={camOn}
          micOn={micOn}
          myName={myName}
          getVideo={getVideo}
          className="aspect-video"
        />
      </div>
    </div>
  );
}