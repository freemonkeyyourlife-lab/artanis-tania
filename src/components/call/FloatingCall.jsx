import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Maximize2, Minimize2, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCallSession } from "@/lib/CallContext";
import { normalizeCallCode } from "@/lib/callLink";
import { useToast } from "@/components/ui/use-toast";
import PipButton from "@/components/call/PipButton";

// Der laufende Call als kleines Fenster: du kannst im Dashboard weiterklicken
// und trotzdem zeigen, was du zeigen willst — der Call reißt dabei nicht ab.
export default function FloatingCall() {
  const { session, joined, closed, peers, camOn, micOn, sharing, toggleCam, toggleMic, attachLocal, getLocalVideo, leave } = useCallSession();
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
      title: "Der Call läuft weiter",
      description: "Du bleibst online und sichtbar. Erst Auflegen beendet den Call.",
    });
  }, [visible, session, toast]);

  if (!visible) return null;

  const roomNumber = session.roomNumber || 1;
  const back = () => navigate(`/call/${session.token}?r=${roomNumber}`);

  if (collapsed) {
    return (
      <div className="fixed bottom-4 right-4 z-[60] flex items-center gap-2 px-3 py-2 rounded-full glass-strong border border-border shadow-2xl">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
        <span className="text-xs font-semibold text-foreground">Chatraum {roomNumber}</span>
        <span className="text-[11px] text-muted-foreground">{peers.length + 1} dabei</span>
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
    <div className="fixed bottom-4 right-4 z-[60] w-[260px] rounded-2xl glass-strong border border-border shadow-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
        <span className="text-xs font-semibold text-foreground flex-1 truncate">Chatraum {roomNumber}</span>
        <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground flex-shrink-0">
          <Users className="w-3 h-3" /> {peers.length + 1}
        </span>
        <button
          onClick={() => setCollapsed(true)}
          title="Klein machen"
          className="w-6 h-6 rounded-full bg-elevated text-muted-foreground flex items-center justify-center hover:text-foreground transition-colors flex-shrink-0"
        >
          <Minimize2 className="w-3 h-3" />
        </button>
      </div>

      <div className="relative aspect-video bg-card">
        <video ref={attachLocal} autoPlay playsInline muted className="w-full h-full object-cover" />
        {!camOn && !sharing && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-card">
            <VideoOff className="w-5 h-5 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">Kamera aus</span>
          </div>
        )}
        <div className="absolute top-2 right-2">
          <PipButton getVideo={getLocalVideo} />
        </div>
      </div>

      <div className="flex items-center gap-2 p-2">
        <button
          onClick={toggleMic}
          title={micOn ? "Mikrofon aus" : "Mikrofon an"}
          className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors", micOn ? "bg-elevated text-foreground" : "bg-destructive/20 text-destructive")}
        >
          {micOn ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={toggleCam}
          title={camOn ? "Kamera aus" : "Kamera an"}
          className={cn("w-8 h-8 rounded-full flex items-center justify-center transition-colors", camOn ? "bg-elevated text-foreground" : "bg-destructive/20 text-destructive")}
        >
          {camOn ? <VideoIcon className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
        </button>
        <button
          onClick={back}
          className="flex-1 px-3 h-8 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold"
        >
          Zum Call
        </button>
        <button
          onClick={leave}
          title="Auflegen — beendet den Call"
          className="w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"
        >
          <PhoneOff className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}