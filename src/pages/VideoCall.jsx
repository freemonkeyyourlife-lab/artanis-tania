import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, Copy, Check, Loader2 } from "lucide-react";

export default function VideoCall() {
  const { token } = useParams();
  const navigate = useNavigate();
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
    let active = true;
    let sub;

    const createPc = () => {
      const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
      pcRef.current = pc;
      localStreamRef.current.getTracks().forEach((t) => pc.addTrack(t, localStreamRef.current));
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
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (e) {
        setStatus("error");
        setError("Kamera und Mikrofon konnten nicht gestartet werden. Bitte Zugriff erlauben.");
        return;
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
  }, [token]);

  const toggleMic = () => {
    const t = localStreamRef.current?.getAudioTracks()[0];
    if (t) { t.enabled = !t.enabled; setMicOn(t.enabled); }
  };
  const toggleCam = () => {
    const t = localStreamRef.current?.getVideoTracks()[0];
    if (t) { t.enabled = !t.enabled; setCamOn(t.enabled); }
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