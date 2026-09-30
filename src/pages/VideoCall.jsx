import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { Mic, MicOff, Video as VideoIcon, VideoOff, ArrowLeft, Home, MessageSquare, X, Lock, Eye, Share2, Bot } from "lucide-react";
import useCallRoom from "@/hooks/useCallRoom";
import CallStage from "@/components/call/CallStage";
import CallControls from "@/components/call/CallControls";
import CallChat from "@/components/call/CallChat";
import CallInvite from "@/components/call/CallInvite";
import CallSharePanel from "@/components/call/CallSharePanel";
import CallBotPanel from "@/components/call/CallBotPanel";
import LiveToggle from "@/components/call/LiveToggle";
import { normalizeCallCode, callInviteUrl } from "@/lib/callLink";
import { getRooms, addRoom } from "@/lib/callRooms";
import { publicName } from "@/lib/displayName";

export default function VideoCall() {
  const { token: rawToken } = useParams();
  const token = normalizeCallCode(rawToken);
  const navigate = useNavigate();
  const [joined, setJoined] = useState(false);
  const [wantCam, setWantCam] = useState(true);
  const [wantMic, setWantMic] = useState(true);
  const [myName, setMyName] = useState("");
  const [sidePanel, setSidePanel] = useState(null);
  const [rooms, setRooms] = useState(() => getRooms());

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const me = await base44.auth.me();
        if (alive) setMyName(publicName(me, ""));
      } catch (e) { /* not logged in */ }
    })();
    return () => { alive = false; };
  }, []);

  const {
    status, error, peers, isHost, camOn, micOn,
    localVideoRef, toggleCam, toggleMic,
    messages, sendChat, sharing, toggleShare, mySeat,
    mode, setMode, watchers, closed,
  } = useCallRoom({ token, joined, wantCam, wantMic, name: myName });

  // Die Raumnummer steht im Link — so wissen beide Seiten, welcher Raum gemeint ist.
  const urlRoom = Number(new URLSearchParams(window.location.search).get("r")) || 0;
  const roomNumber = urlRoom || rooms.find((r) => r.token === token)?.number || 1;
  const inviteLink = callInviteUrl(token, roomNumber);
  // Derselbe Code = derselbe Raum. Sichtbar für alle, damit das sofort prüfbar ist.
  const prettyCode = `${token.slice(0, 4)}-${token.slice(4)}`;

  const openRoom = (room) => navigate(`/call/${room.token}?r=${room.number}`);
  const newRoom = () => {
    const room = addRoom();
    setRooms(getRooms());
    openRoom(room);
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
          <p className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-elevated border border-border text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Chatraum {roomNumber}</span>
            <span className="font-mono tracking-[0.25em] text-foreground">{prettyCode}</span>
          </p>
          <p className="text-sm text-muted-foreground mt-3">
            Du entscheidest selbst, was du teilst. Kamera und Mikrofon kannst du jederzeit wieder ausschalten.
          </p>
          <p className="text-xs text-muted-foreground mt-2">Alle mit demselben Code sind im selben Raum.</p>

          {window.self !== window.top && (
            <div className="mt-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-left">
              <p className="text-sm font-medium text-foreground mb-1">Kamera startet in der Vorschau nicht</p>
              <p className="text-xs text-muted-foreground mb-3">Die Vorschau blockiert Kamera und Mikrofon. Öffne die App in einem eigenen Tab — dort läuft der Video-Call.</p>
              <button onClick={() => window.open(window.location.href, "_blank")} className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                In neuem Tab öffnen
              </button>
            </div>
          )}

          <div className="mt-6 text-left">
            <label className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">Dein Name im Call</label>
            <input
              value={myName}
              onChange={(e) => setMyName(e.target.value)}
              placeholder="Wie sollen dich die anderen nennen?"
              className="mt-2 w-full px-4 py-2.5 rounded-full bg-background border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
            <p className="mt-2 text-xs text-muted-foreground">Ohne Konto, ohne Anmeldung — nur dein Name.</p>
          </div>

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
            <p className="text-xs text-muted-foreground mb-3">Du bist in <span className="font-semibold text-foreground">Chatraum {roomNumber}</span>. Teile diesen Link mit so vielen Leuten, wie du willst — Code, QR-Code und fertiger Text stecken mit drin:</p>
            <CallInvite url={inviteLink} code={token} label={`Chatraum ${roomNumber} einladen`} className="w-full justify-center" />
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
          <span className="px-2.5 py-1 rounded-full bg-elevated border border-border text-[11px] text-muted-foreground flex-shrink-0">
            <span className="font-semibold text-foreground">Chatraum {roomNumber}</span>
            <span className="font-mono tracking-[0.2em] ml-2">{prettyCode}</span>
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isHost && watchers > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-600/20 text-violet-300 text-[11px] font-semibold whitespace-nowrap flex-shrink-0">
              <Eye className="w-3 h-3" /> {watchers} Zuschauer
            </span>
          )}
          <button
            onClick={() => setSidePanel((v) => (v === "chat" ? null : "chat"))}
            title="Chat im Call"
            className={cn("relative w-9 h-9 rounded-full flex items-center justify-center transition-colors", sidePanel === "chat" ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground")}
          >
            <MessageSquare className="w-4 h-4" />
            {sidePanel !== "chat" && messages.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center font-bold">{messages.length}</span>
            )}
          </button>
          <button
            onClick={() => setSidePanel((v) => (v === "bot" ? null : "bot"))}
            title="Parallel mit deinem Bot schreiben"
            className={cn("inline-flex items-center gap-1.5 px-3 h-9 rounded-full text-xs font-semibold transition-colors", sidePanel === "bot" ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground")}
          >
            <Bot className="w-4 h-4" /> <span className="hidden sm:inline">Bot</span>
          </button>
          <button
            onClick={() => setSidePanel((v) => (v === "share" ? null : "share"))}
            title="Alles zum Weitergeben öffnet sich rechts"
            className={cn("inline-flex items-center gap-1.5 px-3 h-9 rounded-full text-xs font-semibold transition-colors", sidePanel === "share" ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground")}
          >
            <Share2 className="w-4 h-4" /> <span className="hidden sm:inline">Teilen</span>
          </button>
          {isHost && <LiveToggle token={token} hostName={myName} />}
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
          myName={myName || "Du"}
          peers={peers}
        />
        {sidePanel && (
          <aside className="absolute inset-0 z-20 sm:static sm:inset-auto sm:z-auto w-full sm:w-96 border-l border-border bg-card flex flex-col">
            <div className="px-2 py-2 border-b border-border flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => setSidePanel("chat")}
                className={cn("px-3 py-1.5 rounded-full text-xs font-semibold transition-colors", sidePanel === "chat" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                Chat
              </button>
              <button
                onClick={() => setSidePanel("share")}
                className={cn("px-3 py-1.5 rounded-full text-xs font-semibold transition-colors", sidePanel === "share" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                Teilen
              </button>
              <button
                onClick={() => setSidePanel("bot")}
                className={cn("px-3 py-1.5 rounded-full text-xs font-semibold transition-colors", sidePanel === "bot" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
              >
                Bot
              </button>
              <button onClick={() => setSidePanel(null)} className="ml-auto w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground" title="Seitenleiste schließen">
                <X className="w-4 h-4" />
              </button>
            </div>
            {sidePanel === "chat" ? (
              <CallChat messages={messages} mySeat={mySeat} onSend={sendChat} />
            ) : sidePanel === "share" ? (
              <CallSharePanel
                token={token}
                roomNumber={roomNumber}
                rooms={rooms}
                isHost={isHost}
                onOpen={openRoom}
                onNewRoom={newRoom}
              />
            ) : (
              <CallBotPanel />
            )}
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