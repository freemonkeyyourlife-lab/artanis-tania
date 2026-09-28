import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { Mic, MicOff, Video as VideoIcon, VideoOff, ArrowLeft, Home, MessageSquare, X, Lock, Eye } from "lucide-react";
import useCallRoom from "@/hooks/useCallRoom";
import CallStage from "@/components/call/CallStage";
import CallControls from "@/components/call/CallControls";
import CallChat from "@/components/call/CallChat";
import CallLink from "@/components/call/CallLink";
import { resetCallToken } from "@/lib/callLink";

export default function VideoCall() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [joined, setJoined] = useState(false);
  const [wantCam, setWantCam] = useState(true);
  const [wantMic, setWantMic] = useState(true);
  const [myName, setMyName] = useState("Du");
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await base44.auth.me();
        if (alive) setMyName(me?.full_name || me?.email || "Du");
      } catch (e) { /* not logged in */ }
    })();
    return () => { alive = false; };
  }, []);

  const {
    status, error, peers, isHost, camOn, micOn,
    localVideoRef, toggleCam, toggleMic,
    messages, sendChat, sharing, toggleShare, mySeat,
    mode, setMode, watchers, closed,
  } = useCallRoom({ token, joined, wantCam, wantMic });

  const inviteLink = `${window.location.origin}/call/${token}`;

  // Der Link bleibt gleich — ein neuer entsteht nur auf ausdrücklichen Wunsch.
  const createNewLink = () => {
    if (!window.confirm("Neuen Link erstellen? Der bisherige Link funktioniert danach nicht mehr.")) return;
    navigate(`/call/${resetCallToken()}`);
  };

  if (!joined) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-6 overflow-y-auto">
        {/* Immer sichtbar — hier hängt niemand fest. */}
        <button
          onClick={() => navigate("/")}
          className="fixed top-4 left-4 z-50 inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-border text-sm text-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Zurück
        </button>
        <div className="w-full max-w-md text-center py-8">
          <h1 className="font-display text-2xl text-foreground">Video-Call beitreten</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Du entscheidest selbst, was du teilst. Kamera und Mikrofon kannst du jederzeit wieder ausschalten.
          </p>

          {window.self !== window.top && (
            <div className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-left">
              <p className="text-sm font-medium text-foreground mb-1">Kamera startet in der Vorschau nicht</p>
              <p className="text-xs text-muted-foreground mb-3">Die Vorschau blockiert Kamera und Mikrofon. Öffne die App in einem eigenen Tab — dort läuft der Video-Call.</p>
              <button onClick={() => window.open(window.location.href, "_blank")} className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                In neuem Tab öffnen
              </button>
            </div>
          )}

          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={() => setWantCam((v) => !v)}
              className={cn("inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold transition-colors", wantCam ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground")}
            >
              {wantCam ? <VideoIcon className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              Kamera {wantCam ? "an" : "aus"}
            </button>
            <button
              onClick={() => setWantMic((v) => !v)}
              className={cn("inline-flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold transition-colors", wantMic ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground")}
            >
              {wantMic ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              Mikrofon {wantMic ? "an" : "aus"}
            </button>
          </div>

          <button
            onClick={() => setJoined(true)}
            className="w-full mt-6 px-6 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold"
          >
            Jetzt beitreten
          </button>

          <div className="mt-8 pt-6 border-t border-border text-left">
            <p className="text-xs text-muted-foreground mb-2">Dein Link bleibt immer derselbe — teile ihn mit so vielen Leuten, wie du willst:</p>
            <CallLink url={inviteLink} onNewLink={createNewLink} />
          </div>
        </div>
      </div>
    );
  }

  // Der Gastgeber hat den Raum zugemacht — hier kommt niemand mehr rein.
  if (closed) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-6 text-center">
        <button
          onClick={() => navigate("/")}
          className="fixed top-4 left-4 z-50 inline-flex items-center gap-2 px-4 py-2 rounded-full glass border border-border text-sm text-foreground hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Zurück
        </button>
        <Lock className="w-10 h-10 text-muted-foreground mb-4" />
        <h1 className="font-display text-2xl text-foreground mb-2">Dieser Raum ist geschlossen</h1>
        <p className="text-sm text-muted-foreground max-w-sm">
          Der Gastgeber lässt gerade niemanden Neues herein. Frag ihn, ob er den Raum wieder öffnet.
        </p>
      </div>
    );
  }

  const statusLabel =
    status === "live" ? `${peers.length + 1} Personen im Call` :
    status === "waiting" ? "Warte auf weitere Teilnehmer…" :
    status === "error" ? "Fehler" : "Verbinde…";

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => navigate("/")}
            title="Zurück zur Startseite"
            className="w-8 h-8 rounded-full bg-elevated text-muted-foreground flex items-center justify-center flex-shrink-0 hover:text-foreground transition-colors"
          >
            <Home className="w-4 h-4" />
          </button>
          <span className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", status === "live" ? "bg-emerald-500" : status === "error" ? "bg-destructive" : "bg-amber-500 animate-pulse")} />
          <span className="text-sm text-foreground font-medium truncate">{statusLabel}</span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isHost && watchers > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-600/20 text-violet-300 text-[11px] font-semibold whitespace-nowrap flex-shrink-0">
              <Eye className="w-3 h-3" /> {watchers} Zuschauer
            </span>
          )}
          <button
            onClick={() => setChatOpen((v) => !v)}
            title="Chat im Call"
            className={cn("relative w-9 h-9 rounded-full flex items-center justify-center transition-colors", chatOpen ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground")}
          >
            <MessageSquare className="w-4 h-4" />
            {!chatOpen && messages.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">{messages.length}</span>
            )}
          </button>
          {isHost && (
            <span className="px-2.5 py-1 rounded-full bg-primary/15 text-primary text-[11px] font-semibold uppercase tracking-wider flex-shrink-0">
              Gastgeber
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 flex min-h-0 relative">
        <CallStage
          localVideoRef={localVideoRef}
          camOn={camOn}
          micOn={micOn}
          myName={myName}
          peers={peers}
        />
        {chatOpen && (
          <aside className="absolute inset-0 z-20 sm:static sm:inset-auto sm:z-auto w-full sm:w-80 border-l border-border bg-card flex flex-col">
            <div className="px-3 py-2 border-b border-border flex items-center justify-between flex-shrink-0">
              <span className="text-sm font-medium text-foreground">Chat im Call</span>
              <button onClick={() => setChatOpen(false)} className="text-muted-foreground hover:text-foreground" title="Chat schließen">
                <X className="w-4 h-4" />
              </button>
            </div>
            <CallChat messages={messages} mySeat={mySeat} onSend={sendChat} />
          </aside>
        )}
      </div>

      {error && (
        <div className="px-4 pb-3 text-center">
          <p className="text-xs text-destructive mb-2">{error}</p>
          {window.self !== window.top && (
            <button
              onClick={() => window.open(window.location.href, "_blank")}
              className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold"
            >
              In neuem Tab öffnen — dort läuft die Kamera
            </button>
          )}
        </div>
      )}

      <div className="px-4 pb-3 flex justify-center">
        <CallLink url={inviteLink} onNewLink={isHost ? createNewLink : null} />
      </div>

      <CallControls
        micOn={micOn}
        camOn={camOn}
        toggleMic={toggleMic}
        toggleCam={toggleCam}
        sharing={sharing}
        onToggleShare={toggleShare}
        mode={mode}
        setMode={setMode}
        onEnd={() => navigate("/live")}
        isHost={isHost}
      />
    </div>
  );
}