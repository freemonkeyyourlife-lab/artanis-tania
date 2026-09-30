import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";

const ICE = [{ urls: "stun:stun.l.google.com:19302" }];

// One room, many participants: every participant keeps one peer connection per
// other participant (mesh) and the actor only relays targeted signals.
export default function useCallRoom({ token, joined, wantCam, wantMic, name }) {
  const [status, setStatus] = useState("connecting");
  const [error, setError] = useState("");
  const [peers, setPeers] = useState([]);
  const [isHost, setIsHost] = useState(false);
  const [camOn, setCamOn] = useState(wantCam);
  const [micOn, setMicOn] = useState(wantMic);
  const [mySeat, setMySeat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [sharing, setSharing] = useState(false);
  const [mode, setModeState] = useState("OPEN");
  const [watchers, setWatchers] = useState(0);
  const [closed, setClosed] = useState(false);
  const [invites, setInvites] = useState([]);

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  const roomRef = useRef(null);
  const pcsRef = useRef(new Map()); // seat -> RTCPeerConnection
  const streamsRef = useRef(new Map()); // seat -> MediaStream
  const infoRef = useRef(new Map()); // seat -> { seat, name, cam, mic, host }
  const pendingIceRef = useRef(new Map()); // seat -> [candidate]
  const remoteSetRef = useRef(new Set()); // seats whose remote description is set
  const pendingPeersRef = useRef(null);
  const mySeatRef = useRef(null);
  const camRef = useRef(wantCam);
  const micRef = useRef(wantMic);
  const screenRef = useRef(null); // laufender Bildschirm-Stream, falls geteilt wird
  const nameRef = useRef(name);
  nameRef.current = name;

  const syncPeers = useCallback(() => {
    // Zuschauer bleiben unsichtbar — sie tauchen in keiner Kachel auf.
    const all = [...infoRef.current.entries()]
      .map(([seat, info]) => ({ seat, ...info, stream: streamsRef.current.get(seat) || null }));
    setWatchers(all.filter((p) => p.watcher).length);
    setPeers(all.filter((p) => !p.watcher).sort((a, b) => a.seat - b.seat));
  }, []);

  useEffect(() => {
    if (!joined) return;
    let active = true;
    let sub;
    const connectedRef = new Set();

    const refreshStatus = () => {
      if (connectedRef.size > 0) setStatus("live");
      else if (infoRef.current.size > 0) setStatus("connecting");
      else setStatus("waiting");
    };

    // The host's decision is authoritative — it arrives with the peer list.
    const applyTrack = (kind, on) => {
      const t = kind === "video"
        ? localStreamRef.current?.getVideoTracks()[0]
        : localStreamRef.current?.getAudioTracks()[0];
      if (t) t.enabled = on;
      if (kind === "video") { camRef.current = on; setCamOn(on); }
      else { micRef.current = on; setMicOn(on); }
    };

    const closePeer = (seat) => {
      pcsRef.current.get(seat)?.close();
      pcsRef.current.delete(seat);
      streamsRef.current.delete(seat);
      pendingIceRef.current.delete(seat);
      remoteSetRef.current.delete(seat);
      connectedRef.delete(seat);
    };

    const createPc = (seat) => {
      const pc = new RTCPeerConnection({ iceServers: ICE });
      pcsRef.current.set(seat, pc);
      const stream = localStreamRef.current;
      stream.getTracks().forEach((t) => pc.addTrack(t, stream));
      // Always able to receive — even when this side sends nothing.
      if (stream.getVideoTracks().length === 0) pc.addTransceiver("video", { direction: "recvonly" });
      if (stream.getAudioTracks().length === 0) pc.addTransceiver("audio", { direction: "recvonly" });
      pc.ontrack = (e) => {
        streamsRef.current.set(seat, e.streams[0]);
        syncPeers();
      };
      pc.onicecandidate = (e) => {
        if (e.candidate) roomRef.current?.send({ type: "signal", to: seat, data: { candidate: e.candidate } });
      };
      pc.onconnectionstatechange = () => {
        const s = pc.connectionState;
        if (s === "connected") { connectedRef.add(seat); setError(""); }
        else if (s === "failed" || s === "closed" || s === "disconnected") connectedRef.delete(seat);
        refreshStatus();
      };
      return pc;
    };

    const flushIce = async (seat, pc) => {
      for (const c of pendingIceRef.current.get(seat) || []) {
        try { await pc.addIceCandidate(c); } catch (e) { /* ignore */ }
      }
      pendingIceRef.current.set(seat, []);
    };

    const offerTo = async (seat) => {
      const pc = pcsRef.current.get(seat);
      if (!pc || pc.signalingState !== "stable") return;
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      roomRef.current?.send({ type: "signal", to: seat, data: { sdp: pc.localDescription } });
    };

    const handleSignal = async (from, data) => {
      if (!data || typeof from !== "number") return;
      let pc = pcsRef.current.get(from);
      if (data.sdp) {
        if (!pc) pc = createPc(from);
        if (data.sdp.type === "offer" && pc.signalingState === "stable") {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          remoteSetRef.current.add(from);
          await flushIce(from, pc);
          const answer = await pc.createAnswer();
          await pc.setLocalDescription(answer);
          roomRef.current?.send({ type: "signal", to: from, data: { sdp: pc.localDescription } });
        } else if (data.sdp.type === "answer" && pc.signalingState === "have-local-offer") {
          await pc.setRemoteDescription(new RTCSessionDescription(data.sdp));
          remoteSetRef.current.add(from);
          await flushIce(from, pc);
        }
      } else if (data.candidate) {
        const cand = new RTCIceCandidate(data.candidate);
        if (pc && remoteSetRef.current.has(from)) {
          try { await pc.addIceCandidate(cand); } catch (e) { /* ignore */ }
        } else {
          pendingIceRef.current.set(from, [...(pendingIceRef.current.get(from) || []), cand]);
        }
      }
    };

    const applyPeers = (list) => {
      const mine = list.find((p) => p.seat === mySeatRef.current);
      // null = this client has not reported yet — never force its own camera off on join.
      if (mine) {
        if (typeof mine.cam === "boolean" && mine.cam !== camRef.current) applyTrack("video", mine.cam);
        if (typeof mine.mic === "boolean" && mine.mic !== micRef.current) applyTrack("audio", mine.mic);
      }
      const others = list.filter((p) => p.seat !== mySeatRef.current);
      infoRef.current = new Map(others.map((p) => [p.seat, p]));
      for (const seat of [...pcsRef.current.keys()]) if (!infoRef.current.has(seat)) closePeer(seat);
      for (const p of others) {
        if (!pcsRef.current.has(p.seat)) {
          createPc(p.seat);
          // Deterministic initiator: the lower seat offers, so both sides never glare.
          if (mySeatRef.current != null && mySeatRef.current < p.seat) offerTo(p.seat);
        }
      }
      syncPeers();
      refreshStatus();
    };

    const start = async () => {
      setInvites([]);
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
        camRef.current = wantCam && stream.getVideoTracks().length > 0;
        micRef.current = wantMic && stream.getAudioTracks().length > 0;
        setCamOn(camRef.current);
        setMicOn(micRef.current);
      } catch (e) {
        // Ohne Kamera weitermachen — sehen und hören kann man trotzdem.
        console.error("Kamera/Mikrofon nicht verfügbar:", e);
        localStreamRef.current = new MediaStream();
        camRef.current = false;
        micRef.current = false;
        setCamOn(false);
        setMicOn(false);
        setError(window.self !== window.top
          ? "Kamera und Mikrofon sind in der Vorschau blockiert. Öffne die App in einem eigenen Tab — dort startet die Kamera."
          : "Kamera und Mikrofon konnten nicht gestartet werden. Bitte im Browser erlauben und neu laden.");
      }

      let connId = sessionStorage.getItem("callConnId");
      if (!connId) { connId = crypto.randomUUID(); sessionStorage.setItem("callConnId", connId); }

      const room = base44.actors.CallRoom(token).connect({ id: connId });
      roomRef.current = room;

      // Subscribe BEFORE saying hello — otherwise the seat assignment can arrive unseen.
      sub = room.subscribe((msg) => {
        if (!msg || typeof msg !== "object") return;
        if (msg.type === "you") {
          mySeatRef.current = msg.seat;
          setMySeat(msg.seat);
          setIsHost(!!msg.host);
          if (pendingPeersRef.current) {
            const list = pendingPeersRef.current;
            pendingPeersRef.current = null;
            applyPeers(list);
          }
        } else if (msg.type === "peers") {
          const list = Array.isArray(msg.peers) ? msg.peers : [];
          if (mySeatRef.current == null) pendingPeersRef.current = list;
          else applyPeers(list);
        } else if (msg.type === "signal") {
          handleSignal(msg.from, msg.data);
        } else if (msg.type === "chat") {
          setMessages((prev) => [...prev.slice(-199), { seat: msg.seat, name: msg.name, text: msg.text, audio: msg.audio || "" }]);
        } else if (msg.type === "closed") {
          setClosed(true);
          localStreamRef.current?.getTracks().forEach((t) => t.stop());
          localStreamRef.current = null;
        } else if (msg.type === "mode") {
          setModeState(msg.mode || "OPEN");
        } else if (msg.type === "invites") {
          // Nur der Gastgeber bekommt diese Liste — sie kommt direkt vom Raum.
          setInvites(Array.isArray(msg.invites) ? msg.invites : []);
        }
      });

      room.send({ type: "media", cam: camRef.current, mic: micRef.current });

      // Wer keinen Namen einträgt, bleibt einfach "Gast" — anmelden muss sich niemand.
      // Der persönliche Gäste-Link reist im hello mit — nur er öffnet einen geschlossenen Raum.
      room.send({
        type: "hello",
        name: String(nameRef.current || "").trim().slice(0, 40) || "Gast",
        guest: new URLSearchParams(window.location.search).get("g") || "",
      });
    };

    start();

    return () => {
      active = false;
      sub?.unsubscribe();
      roomRef.current?.close();
      roomRef.current = null;
      for (const pc of pcsRef.current.values()) pc.close();
      pcsRef.current.clear();
      streamsRef.current.clear();
      infoRef.current.clear();
      connectedRef.clear();
      pendingPeersRef.current = null;
      mySeatRef.current = null;
      screenRef.current?.getTracks().forEach((t) => t.stop());
      screenRef.current = null;
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    };
  }, [token, joined, wantCam, wantMic, syncPeers]);

  const ensureTrack = useCallback(async (kind) => {
    const existing = kind === "video"
      ? localStreamRef.current?.getVideoTracks()[0]
      : localStreamRef.current?.getAudioTracks()[0];
    if (existing) return existing;
    try {
      const s = await navigator.mediaDevices.getUserMedia(kind === "video" ? { video: true } : { audio: true });
      const t = kind === "video" ? s.getVideoTracks()[0] : s.getAudioTracks()[0];
      if (!t) return null;
      if (!localStreamRef.current) localStreamRef.current = new MediaStream();
      localStreamRef.current.addTrack(t);
      for (const [seat, pc] of pcsRef.current.entries()) {
        pc.addTrack(t, localStreamRef.current);
        pc.onnegotiationneeded = async () => {
          if (pc.signalingState !== "stable") return;
          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          roomRef.current?.send({ type: "signal", to: seat, data: { sdp: pc.localDescription } });
        };
      }
      if (kind === "video" && localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
      return t;
    } catch (e) {
      setError("Zugriff auf Kamera/Mikrofon nicht möglich.");
      return null;
    }
  }, []);

  const toggleMic = useCallback(async () => {
    setError("");
    const existing = localStreamRef.current?.getAudioTracks()[0];
    if (existing) {
      const next = !existing.enabled;
      existing.enabled = next;
      micRef.current = next;
      setMicOn(next);
      roomRef.current?.send({ type: "media", cam: camRef.current, mic: next });
      return;
    }
    const t = await ensureTrack("audio");
    if (t) {
      t.enabled = true;
      micRef.current = true;
      setMicOn(true);
      roomRef.current?.send({ type: "media", cam: camRef.current, mic: true });
    }
  }, [ensureTrack]);

  const toggleCam = useCallback(async () => {
    setError("");
    const existing = localStreamRef.current?.getVideoTracks()[0];
    if (existing) {
      const next = !existing.enabled;
      existing.enabled = next;
      camRef.current = next;
      setCamOn(next);
      roomRef.current?.send({ type: "media", cam: next, mic: micRef.current });
      return;
    }
    const t = await ensureTrack("video");
    if (t) {
      t.enabled = true;
      camRef.current = true;
      setCamOn(true);
      roomRef.current?.send({ type: "media", cam: true, mic: micRef.current });
    }
  }, [ensureTrack]);

  // Nur der Gastgeber darf das — der Raum prüft es serverseitig nochmal.
  const setMode = useCallback((next) => {
    roomRef.current?.send({ type: "mode", mode: next });
  }, []);

  // Persönliche Gäste-Links anlegen und sperren — die Liste führt der Raum.
  const createInvite = useCallback((name) => {
    roomRef.current?.send({ type: "invite_create", name: String(name || "").slice(0, 40) });
  }, []);

  const revokeInvite = useCallback((token) => {
    roomRef.current?.send({ type: "invite_revoke", token: String(token || "") });
  }, []);

  // Nachricht an alle im Call — geht denselben Weg wie die Video-Signale.
  const sendChat = useCallback((text) => {
    const t = String(text || "").trim();
    if (!t) return;
    roomRef.current?.send({ type: "chat", text: t.slice(0, 2000) });
  }, []);

  // Sprachnachricht an alle im Call — schon in die gewählte Stimme umgewandelt.
  const sendChatVoice = useCallback((audio) => {
    const url = String(audio || "").trim();
    if (!url) return;
    roomRef.current?.send({ type: "chat", audio: url });
  }, []);

  // Bildschirm statt Kamera senden — alle sehen ihn sofort, ohne neu zu verbinden.
  const stopShare = useCallback(() => {
    const screen = screenRef.current;
    if (!screen) return;
    screenRef.current = null;
    screen.onended = null;
    screen.getTracks().forEach((t) => t.stop());
    const cam = localStreamRef.current?.getVideoTracks()[0] || null;
    for (const pc of pcsRef.current.values()) {
      const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
      if (sender && cam) sender.replaceTrack(cam).catch(() => {});
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = localStreamRef.current;
    setSharing(false);
  }, []);

  const toggleShare = useCallback(async () => {
    if (screenRef.current) { stopShare(); return; }
    setError("");
    try {
      if (!localStreamRef.current?.getVideoTracks()[0]) {
        const t = await ensureTrack("video");
        if (!t) return;
      }
      const display = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const track = display.getVideoTracks()[0];
      screenRef.current = track;
      for (const pc of pcsRef.current.values()) {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === "video");
        if (sender) sender.replaceTrack(track).catch(() => {});
      }
      if (localVideoRef.current) localVideoRef.current.srcObject = display;
      track.onended = () => stopShare();
      setSharing(true);
    } catch (e) {
      console.error("Bildschirm teilen nicht möglich:", e);
      setError(window.self !== window.top
        ? "Bildschirm teilen ist in der Vorschau blockiert. Öffne die App in einem eigenen Tab — dort funktioniert es."
        : "Bildschirm teilen wurde abgebrochen oder ist nicht erlaubt.");
    }
  }, [ensureTrack, stopShare]);

  return {
    status, error, peers, isHost, camOn, micOn,
    localVideoRef, toggleCam, toggleMic,
    messages, sendChat, sendChatVoice, sharing, toggleShare, mySeat,
    mode, setMode, watchers, closed,
    invites, createInvite, revokeInvite,
  };
}