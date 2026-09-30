import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Maximize2, Minimize2, Users, Monitor, MonitorOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallSession } from "@/lib/CallContext";
import { normalizeCallCode, callInviteUrl } from "@/lib/callLink";
import { useToast } from "@/components/ui/use-toast";
import MiniCallVideo from "@/components/call/MiniCallVideo";
import CallInvite from "@/components/call/CallInvite";
import PipButton from "@/components/call/PipButton";

// Der laufende Call als kleines Fenster: du bleibst bei dem, was du gerade
// machst, siehst trotzdem alle — und wenn jemand seinen Bildschirm zeigt,
// siehst du den genauso. Erst Auflegen beendet den Call.
export default function FloatingCall() {
  const {
    session, joined, closed, peers, camOn, micOn, sharing,
    toggleCam, toggleMic, toggleShare, attachLocal, getLocalVideo, myScreen, leave,
  } = useCallSession();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [collapsed, setCollapsed] = useState(false);
  const toldRef = useRef("");

  const pathToken = location.pathname.startsWith("/call/")
    ? normalizeCallCode(location.pathname.split("/")[2] || "")
    : "";
  const visible = joined && !!session && !closed && pathToken !== session?.token;

  // Einmal pro Call: damit klar ist, dass niemand versehentlich rausgeflogen ist.
  useEffect(() => {
    if (!visible || !session) return;
    if (toldRef.current === session.token) return;
    toldRef.current = session.token;
    toast({
      title: "Der Call läuft klein mit",
      description: "Du bleibst online und sichtbar — mach einfach hier weiter. Erst Auflegen beendet den Call.",
    });
  }, [visible, session, toast]);

  if (!visible) return null;

  const roomNumber = session.roomNumber || 1;
  const myName = session.name || "Du";
  const count = peers.length + 1;
  // Zeigt gerade jemand etwas? Dann steht der Bildschirm groß und die Gesichter
  // bleiben daneben stehen — keiner fliegt aus dem Bild.
  const sharer = peers.find((p) => p.sharing && p.screen) || null;
  const screenStream = myScreen || sharer?.screen || null;
  const screenBy = myScreen ? `${myName} (du)` : sharer?.name || `Gast ${sharer?.seat}`;

  if (collapsed) {
    return (
      <div className="fixed bottom-4 right-4 z-[60] flex items-center gap-2 px-3 py-2 rounded-full glass-strong border border-border shadow-2xl">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
        <span className="text-xs font-semibold text-foreground">Chatraum {roomNumber}</span>
        <span className="text-[11px] text-muted-foreground">{count} dabei</span>
        <button
          onClick={() => setCollapsed(false)}
          title="Call-Fenster zeigen"
          className="w-7 h-7 rounded-full bg-elevated text-muted-foreground flex items-center justify-center hover:text-foreground transition-colors"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-[60] w-[340px] max-w-[calc(100vw-2rem)] rounded-2xl glass-strong border border-border shadow-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
        <span className="text-xs font-semibold text-foreground flex-1 truncate">Chatraum {roomNumber}</span>
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground flex-shrink-0">
          <Users className="w-3 h-3" /> {count}
        </span>
        <button
          onClick={() => navigate(`/call/${session.token}?r=${roomNumber}`)}
          title="Groß machen — der ganze Call"
          className="w-6 h-6 rounded-full bg-elevated text-muted-foreground flex items-center justify-center hover:text-foreground transition-colors flex-shrink-0"
        >
          <Maximize2 className="w-3 h-3" />
        </button>
        <button
          onClick={() => setCollapsed(true)}
          title="Klein machen"
          className="w-6 h-6 rounded-full bg-elevated text-muted-foreground flex items-center justify-center hover:text-foreground transition-colors flex-shrink-0"
        >
          <Minimize2 className="w-3 h-3" />
        </button>
      </div>

      <div className="p-2 space-y-2">
        {screenStream ? (
          <>
            <MiniCallVideo stream={screenStream} name={`${screenBy} zeigt den Bildschirm`} contain className="border-primary/40" />
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {peers.map((peer) => (
                <MiniCallVideo
                  key={peer.seat}
                  stream={peer.stream}
                  camOn={peer.cam}
                  micOn={peer.mic}
                  name={peer.name || `Gast ${peer.seat}`}
                  className="w-[46%] flex-shrink-0"
                />
              ))}
              <MiniCallVideo
                attachRef={attachLocal}
                camOn={camOn}
                micOn={micOn}
                name={`${myName} (du)`}
                className="w-[46%] flex-shrink-0"
              />
            </div>
          </>
        ) : (
          <div className={cn("grid gap-2", count === 1 ? "grid-cols-1" : "grid-cols-2")}>
            {peers.map((peer) => (
              <MiniCallVideo
                key={peer.seat}
                stream={peer.stream}
                camOn={peer.cam}
                micOn={peer.mic}
                name={peer.name || `Gast ${peer.seat}`}
              />
            ))}
            <MiniCallVideo
              attachRef={attachLocal}
              camOn={camOn}
              micOn={micOn}
              name={`${myName} (du)`}
              overlay={<PipButton getVideo={getLocalVideo} />}
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 p-2 pt-0">
        <button
          onClick={toggleMic}
          title={micOn ? "Mikrofon aus" : "Mikrofon an"}
          className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0", micOn ? "bg-elevated text-foreground" : "bg-destructive/20 text-destructive")}
        >
          {micOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={toggleCam}
          title={camOn ? "Kamera aus" : "Kamera an"}
          className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0", camOn ? "bg-elevated text-foreground" : "bg-destructive/20 text-destructive")}
        >
          {camOn ? <VideoIcon className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={toggleShare}
          title={sharing ? "Bildschirm-Teilen beenden" : "Bildschirm teilen — alle sehen ihn"}
          className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0", sharing ? "bg-primary text-primary-foreground" : "bg-elevated text-foreground")}
        >
          {sharing ? <MonitorOff className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
        </button>
        <CallInvite
          url={callInviteUrl(session.token, roomNumber)}
          code={session.token}
          label="Einladen"
          className="h-8 px-3 text-[11px] gap-1.5"
        />
        <button
          onClick={leave}
          title="Auflegen — beendet den Call"
          className="ml-auto w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center flex-shrink-0"
        >
          <PhoneOff className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}