import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Copy, Check, Loader2 } from "lucide-react";

export default function VideoCall() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [joined, setJoined] = useState(false);
  const [wantCam, setWantCam] = useState(true);
  const [wantMic, setWantMic] = useState(true);
  const [status, setStatus] = useState("connecting");
  const [error, setError] = useState("");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [peerName, setPeerName] = useState("");
  const [copied, setCopied] = useState(false);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const pcRef = useRef(null);
  const roomRef = useRef(null);
  const mySeatRef = useRef(null);
  const remoteSetRef = useRef(false);
  const pendingIceRef = useRef([]);

  useEffect(() => {
    if (!joined) return;
    let active = true;
    let sub;

    const createPc = () => {
      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      pcRef.current = pc;
      const localStream = localStreamRef.current;
      localStream.getTracks().forEach((t) => pc.addTrack(t, localStream));
      // Immer empfangen können — auch wenn diese Seite selbst nichts sendet.
      if (localStream.getVideoTracks().length === 0) pc.addTransceiver("video", { direction: "recvonly" });
      if (localStream.getAudioTracks().length === 0) pc.addTransceiver("audio", { direction: "recvonly" });
      pc.ontrack = (e) => {
        if (remoteVideoRef.current && remoteVideoRef.current.srcObject !== e.streams[0]) {
          remoteVideoRef.current.srcObject = e.streams[0];
        }
        setStatus("live");
      };
      pc.onicecandidate = (e) => {
        if (e.candidate) roomRef.current?.send({ type: "signal", data: { candidate: e.candidate } });
      };
      pc.onconnectionstatechange = () => {
        const s = pc.connectionState;
        if (s === "connected") setStatus("live");
        else if (s === "failed") { setStatus("error"); setError("Verbindung fehlgeschlagen. Bitte erneut versuchen."); }
        else if (s === "disconnected") setStatus("reconnecting");
      };
      return pc;
    };

    const flushIce = async (pc) => {
      for (const c of pendingIceRef.current) { try { await pc.addIceCandidate(c); } catch (e) { /* ignore */ } }
      pendingIceRef.current = [];
    };

    const handleSignal = async (data) => {
      if (!data) return;
      let pc = pcRef.current;
      if (data.sdp) {
        if (!pc) pc = createPc();
        const desc = data.sdp;
        if (desc.type === "offer" && pc.signalingState === "stable") {
          await pc.setRemoteDescription(new RTCSessionDescription(desc));
          remoteSetRef.current = true;
          await flushIce(pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          roomRef.current?.send({ type: "signal", data: { sdp: pc.localDescription } });
        } else if (desc.type === "answer" && pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(desc));
          remoteSetRef.current = true;
          await flushIce(pc);
        }
      } else if (data.candidate) {
        const cand = new RTCIceCandidate(data.candidate);
        if (pc && remoteSetRef.current) { try { await pc.addIceCandidate(cand); } catch (e) { /* ignore */ } }
        else pendingIceRef.current.push(cand);
      }
    };

    const createOffer = async () => {
      const pc = createPc();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      roomRef.current?.send({ type: "signal", data: { sdp: pc.localDescription } });
    };

    const resetPeer = () => {
      if (pcRef.current) { pcRef.current.close(); pcRef.current = null; }
      remoteSetRef.current = false;
      pendingIceRef.current = [];
      if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
    };

    const start = async () => {
      try {
        const constraints = {};
        if (wantCam) constraints.video = true;
        if (wantMic) constraints.audio = true;
        const stream = wantCam || wantMic
          ? await navigator.mediaDevices.getUserMedia(constraints)
          : new MediaStream();
        if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (e) {
        // Ohne Kamera weitermachen — sehen und hören kann man trotzdem.
        console.error("Kamera/Mikrofon nicht verfügbar:", e);
        localStreamRef.current = new MediaStream();
        setCamOn(false);
        setMicOn(false);
        setStatus("waiting");
        setError(window.self !== window.top
          ? "Kamera und Mikrofon sind in der Vorschau blockiert. Öffne die App in einem eigenen Tab — dort startet die Kamera."
          : "Kamera und Mikrofon konnten nicht gestartet werden. Bitte im Browser erlauben und neu laden.");
      }

      let connId = sessionStorage.getItem("callConnId");
      if (!connId) { connId = crypto.randomUUID(); sessionStorage.setItem("callConnId", connId); }

      const room = base44.actors.CallRoom(token).connect({ id: connId });
      roomRef.current = room;

      let name = "Gast";
      try { const me = await base44.auth.me(); name = me?.full_name || me?.email || "Gast"; } catch (e) { /* not logged in */ }
      room.send({ type: "hello", name });

      sub = room.subscribe(async (msg) => {
        if (!msg || typeof msg !== "object") return;
        if (msg.type === "you") {
          mySeatRef.current = msg.seat;
        } else if (msg.type === "peers") {
          const other = (msg.peers || []).filter((p) => p.seat !== mySeatRef.current)[0];
          if (other) {
            setPeerName(other.name || "Teilnehmer");
            const iAmInitiator = mySeatRef.current != null && mySeatRef.current < other.seat;
            if (iAmInitiator && !pcRef.current) await createOffer();
          } else {
            setStatus((s) => (s === "live" ? s : "waiting"));
            resetPeer();
          }
        } else if (msg.type === "signal") {
          await handleSignal(msg.data);
        }
      });
    };

    start();

    return () => {
      active = false;
      sub?.unsubscribe();
      roomRef.current?.close();
      pcRef.current?.close();
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, [token, joined, wantCam, wantMic]);

  // Kamera/Mikrofon wird erst geholt, wenn der Nutzer es wirklich will.
  const ensureTrack = async (kind) => {
    const existing = kind === "video" ? localStreamRef.current?.getVideoTracks()[0] : localStreamRef.current?.getAudioTracks()[0];
    if (existing) return existing;
    try {
      const s = await navigator.mediaDevices.getUserMedia(kind === "video" ? { video: true } : { audio: true });
      const t = kind === "video" ? s.getVideoTracks()[0] : s.getAudioTracks()[0];
      localStreamRef.current.addTrack(t);
      const pc = pcRef.current;
      if (pc) {
        pc.onnegotiationneeded = async () => {
          if (pc.signalingState !== "stable") return;
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          roomRef.current?.send({ type: "signal", data: { sdp: pc.localDescription } });
        };
        pc.addTrack(t, localStreamRef.current);
      }
      if (kind === "video" && localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
      return t;
    } catch (e) {
      setError("Zugriff auf Kamera/Mikrofon nicht möglich.");
      return null;
    }
  };

  const toggleMic = async () => {
    const existing = localStreamRef.current?.getAudioTracks()[0];
    if (existing) { existing.enabled = !existing.enabled; setMicOn(existing.enabled); return; }
    const t = await ensureTrack("audio");
    if (t) setMicOn(true);
  };
  const toggleCam = async () => {
    const existing = localStreamRef.current?.getVideoTracks()[0];
    if (existing) { existing.enabled = !existing.enabled; setCamOn(existing.enabled); return; }
    const t = await ensureTrack("video");
    if (t) setCamOn(true);
  };
  const endCall = () => {
    pcRef.current?.close();
    roomRef.current?.close();
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    navigate("/live");
  };

  const inviteLink = `${window.location.origin}/call/${token}`;
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) { /* clipboard blocked */ }
  };

  if (!joined) {
    return (
      <div className="fixed inset-0 bg-background flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
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
            onClick={() => { setMicOn(wantMic); setCamOn(wantCam); setJoined(true); }}
            className="w-full mt-6 px-6 py-3.5 rounded-full bg-primary text-primary-foreground font-semibold"
          >
            Jetzt beitreten
          </button>

          <div className="mt-8 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Teile diesen Link, um jemanden einzuladen:</p>
            <div className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2">
              <span className="text-sm text-foreground truncate flex-1 text-left">{inviteLink}</span>
              <button onClick={copyLink} className="text-primary flex-shrink-0" title="Link kopieren">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const statusLabel =
    status === "live" ? `Verbunden mit ${peerName || "Teilnehmer"}` :
    status === "waiting" ? "Warte auf Teilnehmer…" :
    status === "reconnecting" ? "Verbindung wird wiederhergestellt…" :
    status === "error" ? "Fehler" : "Verbinde…";

  return (
    <div className="fixed inset-0 bg-background flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn("w-2.5 h-2.5 rounded-full flex-shrink-0", status === "live" ? "bg-emerald-500" : status === "error" ? "bg-destructive" : "bg-amber-500 animate-pulse")} />
          <span className="text-sm text-foreground font-medium truncate">{statusLabel}</span>
        </div>
      </div>

      <div className="relative flex-1 bg-black overflow-hidden">
        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />

        {status !== "live" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 gap-4">
            {error ? (
              <p className="text-destructive max-w-md text-sm">{error}</p>
            ) : (
              <>
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <p className="text-muted-foreground max-w-md text-sm">Teile diesen Link, um jemanden in den Video-Call einzuladen:</p>
                <div className="flex items-center gap-2 bg-card border border-border rounded-full px-4 py-2 max-w-full">
                  <span className="text-sm text-foreground truncate">{inviteLink}</span>
                  <button onClick={copyLink} className="text-primary flex-shrink-0" title="Link kopieren">
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        <div className="absolute bottom-4 right-4 w-28 sm:w-44 aspect-[3/4] rounded-xl overflow-hidden border border-border bg-card">
          <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
          {!camOn && (
            <div className="absolute inset-0 flex items-center justify-center bg-card">
              <VideoOff className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 py-4 border-t border-border">
        <button
          onClick={toggleMic}
          className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors", micOn ? "bg-elevated text-foreground" : "bg-destructive text-white")}
          title={micOn ? "Mikrofon aus" : "Mikrofon an"}
        >
          {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>
        <button
          onClick={toggleCam}
          className={cn("w-12 h-12 rounded-full flex items-center justify-center transition-colors", camOn ? "bg-elevated text-foreground" : "bg-destructive text-white")}
          title={camOn ? "Kamera aus" : "Kamera an"}
        >
          {camOn ? <VideoIcon className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>
        <button
          onClick={endCall}
          className="w-14 h-14 rounded-full bg-destructive text-white flex items-center justify-center"
          title="Call beenden"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}