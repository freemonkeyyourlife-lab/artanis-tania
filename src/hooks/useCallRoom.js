import { useState, useEffect, useRef, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { lineFromMessage, generateStageReply } from "@/lib/stageChat";
import { takePendingStage, onStageRequest } from "@/lib/callStage";
import { createScreenMixer } from "@/lib/screenShare";
import { readPreferredCamera, savePreferredCamera } from "@/lib/videoSource";

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
  // Der eigene geteilte Bildschirm — er läuft neben dem eigenen Kamerabild.
  const [myScreen, setMyScreen] = useState(null);
  const [screens, setScreens] = useState([]); // [{ id, label }] — was gerade gezeigt wird
  const [mode, setModeState] = useState("OPEN");
  const [watchers, setWatchers] = useState(0);
  const [closed, setClosed] = useState(false);
  const [invites, setInvites] = useState([]);
  // Die Bühne: der Plattform-Chat, den gerade alle im Call zusammen lesen.
  const [stage, setStage] = useState(null);
  const [stageLines, setStageLines] = useState([]);
  // Was am Gerät hängt: Kameras und Mikrofone — auch eine externe Cam.
  const [devices, setDevices] = useState({ video: [], audio: [] });
  const [activeDevice, setActiveDevice] = useState({ video: "", audio: "" });

  const localVideoRef = useRef(null);
  const localStreamRef = useRef(null);
  // Was gerade im eigenen Bild steckt — Kamera oder geteilter Bildschirm.
  const previewRef = useRef(null);
  const roomRef = useRef(null);
  const pcsRef = useRef(new Map()); // seat -> RTCPeerConnection
  // Pro Person können zwei Bilder laufen — Kamera und geteilter Bildschirm.
  const streamsRef = useRef(new Map()); // seat -> Map<streamId, MediaStream>
  const infoRef = useRef(new Map()); // seat -> { seat, name, cam, mic, host }
  const pendingIceRef = useRef(new Map()); // seat -> [candidate]
  const remoteSetRef = useRef(new Set()); // seats whose remote description is set
  const pendingPeersRef = useRef(null);
  const mySeatRef = useRef(null);
  const camRef = useRef(wantCam);
  const micRef = useRef(wantMic);
  const screenRef = useRef(null); // die gemeinsame Bild-Spur, falls geteilt wird
  // Alle gewählten Bildschirme landen auf einer gemeinsamen Fläche und reisen
  // als EIN Bild — so sind beliebig viele Monitore gleichzeitig zu sehen.
  const mixerRef = useRef(null);
  const screenStreamsRef = useRef([]);
  const screenLabelRef = useRef(0);
  // Was im Call in den laufenden Plattform-Chat geschrieben wird, trägt der
  // Gastgeber in die echte Unterhaltung ein.
  const stageWriteRef = useRef(null);
  const writtenRef = useRef(new Set());
  const nameRef = useRef(name);
  nameRef.current = name;

  // Das eigene Bild darf den Platz wechseln (groß im Call, klein als Mini-Fenster)
  // — es hängt sich dabei neu ein, ohne dass der Stream abreißt.
  const setPreview = useCallback((stream) => {
    previewRef.current = stream || null;
    if (localVideoRef.current) localVideoRef.current.srcObject = stream || null;
  }, []);

  const attachLocal = useCallback((el) => {
    localVideoRef.current = el;
    if (el) el.srcObject = previewRef.current || null;
  }, []);

  const syncPeers = useCallback(() => {
    // Zuschauer bleiben unsichtbar — sie tauchen in keiner Kachel auf.
    const all = [...infoRef.current.entries()]
      .map(([seat, info]) => {
        const byId = streamsRef.current.get(seat) || new Map();
        // Der geteilte Bildschirm hat seine eigene Kennung — so bleibt das
        // Gesicht daneben sichtbar, statt vom Bildschirm verdrängt zu werden.
        const screen = info.screenId ? byId.get(info.screenId) || null : null;
        const cam = [...byId.values()].find((s) => s !== screen && s.getVideoTracks().length > 0) || null;
        return { seat, ...info, stream: cam, screen, sharing: !!info.share && !!screen };
      });
    setWatchers(all.filter((p) => p.watcher).length);
    setPeers(all.filter((p) => !p.watcher).sort((a, b) => a.seat - b.seat));
  }, []);

  useEffect(() => {
    if (!joined || !token) return;
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
        const incoming = e.streams[0];
        if (!incoming) return;
        const byId = streamsRef.current.get(seat) || new Map();
        byId.set(incoming.id, incoming);
        streamsRef.current.set(seat, byId);
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
        // Die beim Start gewählte Kamera gilt auch hier — auch eine externe.
        const preferredCam = readPreferredCamera();
        const constraints = {};
        if (wantCam) constraints.video = preferredCam ? { deviceId: { exact: preferredCam } } : true;
        if (wantMic) constraints.audio = true;
        let stream;
        if (wantCam || wantMic) {
          try {
            stream = await navigator.mediaDevices.getUserMedia(constraints);
          } catch (err) {
            // Die gemerkte Kamera ist gerade nicht angeschlossen — dann die Standardkamera.
            if (preferredCam && wantCam) {
              constraints.video = true;
              stream = await navigator.mediaDevices.getUserMedia(constraints);
            } else {
              throw err;
            }
          }
        } else {
          stream = new MediaStream();
        }
        if (!active) { stream.getTracks().forEach((t) => t.stop()); return; }
        localStreamRef.current = stream;
        setPreview(stream);
        camRef.current = wantCam && stream.getVideoTracks().length > 0;
        micRef.current = wantMic && stream.getAudioTracks().length > 0;
        setCamOn(camRef.current);
        setMicOn(micRef.current);
      } catch (e) {
        // Ohne Kamera weitermachen — sehen und hören kann man trotzdem.
        console.error("Kamera/Mikrofon nicht verfügbar:", e);
        localStreamRef.current = new MediaStream();
        setPreview(localStreamRef.current);
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
          setPreview(null);
        } else if (msg.type === "mode") {
          setModeState(msg.mode || "OPEN");
        } else if (msg.type === "invites") {
          // Nur der Gastgeber bekommt diese Liste — sie kommt direkt vom Raum.
          setInvites(Array.isArray(msg.invites) ? msg.invites : []);
        } else if (msg.type === "stage") {
          setStage(msg.stage || null);
          if (!msg.stage) setStageLines([]);
        } else if (msg.type === "stage_lines") {
          setStageLines(Array.isArray(msg.lines) ? msg.lines : []);
        } else if (msg.type === "stage_line") {
          const line = msg.line;
          if (line) setStageLines((prev) => (prev.some((l) => l.id === line.id) ? prev : [...prev.slice(-119), line]));
          // Nur was im Call geschrieben wurde, muss noch in die echte Unterhaltung.
          if (line?.seat) stageWriteRef.current?.(line);
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
      screenRef.current?.stop();
      screenRef.current = null;
      mixerRef.current?.stop();
      mixerRef.current = null;
      screenStreamsRef.current.forEach((s) => s.getVideoTracks().forEach((t) => t.stop()));
      screenStreamsRef.current = [];
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
      previewRef.current = null;
    };
  }, [token, joined, wantCam, wantMic, syncPeers, setPreview]);

  // Der Gastgeber ist die Brücke: er liest die echte Unterhaltung und trägt ein,
  // was im Call geschrieben wird. Alle anderen sehen einfach mit.
  useEffect(() => {
    if (!isHost || !stage?.id) { stageWriteRef.current = null; return; }
    let alive = true;
    let unsubscribe;

    (async () => {
      let conversation = null;
      let creator = null;
      let history = [];
      try {
        const messages = await base44.entities.Message.filter({ conversationId: stage.id }, "created_date", 120);
        history = messages.map(lineFromMessage).filter((l) => l.text);
        conversation = await base44.entities.Conversation.get(stage.id);
        if (conversation?.creatorId) {
          const found = await base44.entities.Creator.filter({ id: conversation.creatorId });
          creator = found[0] || null;
        }
      } catch (e) {
        // Ohne Vorgeschichte geht es trotzdem los.
      }
      if (!alive) return;
      roomRef.current?.send({ type: "stage_seed", lines: history });

      // Neue Zeilen der echten Unterhaltung gehen sofort an alle im Call.
      unsubscribe = base44.entities.Message.subscribe((event) => {
        if (event.type !== "create" || event.data?.conversationId !== stage.id) return;
        if (writtenRef.current.has(event.data.id)) { writtenRef.current.delete(event.data.id); return; }
        const line = lineFromMessage(event.data);
        if (!line.text) return;
        history = [...history, line].slice(-120);
        roomRef.current?.send({ type: "stage_line", line });
      });

      stageWriteRef.current = async (line) => {
        try {
          const created = await base44.entities.Message.create({
            conversationId: stage.id,
            sender: line.sender || "Gast",
            senderType: "HUMAN",
            text: line.text,
          });
          writtenRef.current.add(created.id);
          history = [...history, { id: created.id, sender: line.sender, senderType: "HUMAN", text: line.text }].slice(-120);
          const reply = await generateStageReply({ conversation, creator, history });
          if (!reply || !alive) return;
          const aiMsg = await base44.entities.Message.create({
            conversationId: stage.id,
            sender: creator?.stageName || conversation?.creatorName || "Charakter",
            senderType: "AI",
            text: reply,
          });
          history = [...history, { id: aiMsg.id, sender: aiMsg.sender, senderType: "AI", text: reply }].slice(-120);
        } catch (e) {
          // Der Call läuft weiter — nur diese Zeile kam nicht durch.
        }
      };
    })();

    return () => {
      alive = false;
      unsubscribe?.();
      stageWriteRef.current = null;
    };
  }, [isHost, stage?.id]);

  // Der Gastgeber legt fest, welcher Plattform-Chat im Call läuft.
  const openStage = useCallback((conversation) => {
    if (!conversation?.id) return;
    roomRef.current?.send({ type: "stage_open", id: conversation.id, title: conversation.title || "" });
  }, []);

  const closeStage = useCallback(() => {
    roomRef.current?.send({ type: "stage_close" });
  }, []);

  const sayOnStage = useCallback((text) => {
    const t = String(text || "").trim();
    if (!t) return;
    roomRef.current?.send({ type: "stage_say", text: t.slice(0, 2000) });
  }, []);

  // Aus der Chat-Seite heraus: derselbe Chat, nur eben im Call.
  useEffect(() => {
    if (!joined) return;
    const apply = (req) => {
      if (!req?.id) return;
      roomRef.current?.send({ type: "stage_open", id: req.id, title: req.title || "" });
    };
    apply(takePendingStage());
    return onStageRequest(apply);
  }, [joined, token]);

  // Ein neuer Track braucht eine frische Aushandlung mit jeder Gegenseite.
  const negotiate = useCallback(async (seat, pc) => {
    if (!pc || pc.signalingState !== "stable") return;
    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      roomRef.current?.send({ type: "signal", to: seat, data: { sdp: pc.localDescription } });
    } catch (e) {
      // Beim nächsten Signal klappt es — der Call läuft weiter.
    }
  }, []);

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
        negotiate(seat, pc);
      }
      if (kind === "video") setPreview(localStreamRef.current);
      return t;
    } catch (e) {
      setError("Zugriff auf Kamera/Mikrofon nicht möglich.");
      return null;
    }
  }, [setPreview, negotiate]);

  // Welche Kameras und Mikrofone dranhängen — auch eine externe Cam oder das
  // Handy als Webcam. Namen gibt es erst, wenn der Zugriff erlaubt ist.
  const listDevices = useCallback(async () => {
    try {
      const all = await navigator.mediaDevices.enumerateDevices();
      setDevices({
        video: all.filter((d) => d.kind === "videoinput").map((d) => ({ id: d.deviceId, label: d.label || "Kamera" })),
        audio: all.filter((d) => d.kind === "audioinput").map((d) => ({ id: d.deviceId, label: d.label || "Mikrofon" })),
      });
      setActiveDevice({
        video: localStreamRef.current?.getVideoTracks()[0]?.getSettings?.().deviceId || "",
        audio: localStreamRef.current?.getAudioTracks()[0]?.getSettings?.().deviceId || "",
      });
    } catch (e) {
      setDevices({ video: [], audio: [] });
    }
  }, []);

  // Sobald der Zugriff läuft, stehen die Gerätenamen bereit.
  useEffect(() => {
    if (joined) listDevices();
  }, [joined, listDevices]);

  // Auf eine andere Kamera oder ein anderes Mikrofon umschalten. Die Gegenseite
  // sieht sofort das neue Bild — nichts reißt ab, der Call läuft weiter.
  const switchDevice = useCallback(async (kind, deviceId) => {
    setError("");
    try {
      const s = await navigator.mediaDevices.getUserMedia(
        kind === "video" ? { video: { deviceId: { exact: deviceId } } } : { audio: { deviceId: { exact: deviceId } } }
      );
      const track = kind === "video" ? s.getVideoTracks()[0] : s.getAudioTracks()[0];
      if (!track) return;
      track.enabled = kind === "video" ? camRef.current : micRef.current;
      if (!localStreamRef.current) localStreamRef.current = new MediaStream();
      const stream = localStreamRef.current;
      const old = kind === "video" ? stream.getVideoTracks()[0] : stream.getAudioTracks()[0];
      if (old) { old.stop(); stream.removeTrack(old); }
      stream.addTrack(track);
      for (const [seat, pc] of pcsRef.current.entries()) {
        const sender = pc.getSenders().find((sn) => sn.track && sn.track.kind === kind);
        if (sender) await sender.replaceTrack(track);
        else { pc.addTrack(track, stream); negotiate(seat, pc); }
      }
      if (kind === "video") { setPreview(stream); savePreferredCamera(deviceId); }
      await listDevices();
    } catch (e) {
      setError("Diese Kamera ließ sich nicht öffnen.");
    }
  }, [listDevices, negotiate, setPreview]);

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
  // Mit eigenem Code, wenn die App den Link schon kennt (z. B. für Telegram).
  const createInvite = useCallback((name, code) => {
    roomRef.current?.send({ type: "invite_create", name: String(name || "").slice(0, 40), token: String(code || "") });
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
    const track = screenRef.current;
    if (!track && !mixerRef.current) return;
    screenRef.current = null;
    // Alle Bildschirme gehen zusammen — die Kamera lief die ganze Zeit weiter.
    screenStreamsRef.current.forEach((s) => s.getVideoTracks().forEach((t) => { t.onended = null; t.stop(); }));
    screenStreamsRef.current = [];
    for (const [seat, pc] of pcsRef.current.entries()) {
      const sender = track ? pc.getSenders().find((s) => s.track === track) : null;
      if (!sender) continue;
      try { pc.removeTrack(sender); } catch (e) { /* schon weg */ }
      negotiate(seat, pc);
    }
    mixerRef.current?.stop();
    mixerRef.current = null;
    setMyScreen(null);
    setSharing(false);
    setScreens([]);
    roomRef.current?.send({ type: "media", cam: camRef.current, mic: micRef.current, share: false, screenId: "" });
  }, [negotiate]);

  // Das Auswahlfenster des Browsers listet alle angeschlossenen Bildschirme auf.
  // „monitor" gibt den ganzen Bildschirm den Vorrang, surfaceSwitching lässt dich
  // mitten im Teilen auf einen anderen Monitor wechseln.
  const pickScreen = () =>
    navigator.mediaDevices.getDisplayMedia({
      video: { displaySurface: "monitor" },
      audio: false,
      systemAudio: "include",
      surfaceSwitching: "include",
      selfBrowserSurface: "exclude",
      monitorTypeSurfaces: "include",
      preferCurrentTab: false,
    });

  // Einen Bildschirm wieder wegnehmen — der Rest bleibt einfach stehen.
  const removeScreen = useCallback((id) => {
    const stream = screenStreamsRef.current.find((s) => s.id === id);
    if (!stream) return;
    screenStreamsRef.current = screenStreamsRef.current.filter((s) => s.id !== id);
    mixerRef.current?.remove(stream);
    stream.getVideoTracks().forEach((t) => { t.onended = null; t.stop(); });
    setScreens((prev) => prev.filter((s) => s.id !== id));
    if (screenStreamsRef.current.length === 0) stopShare();
  }, [stopShare]);

  // Einen weiteren Bildschirm dazunehmen. Er kommt neben die anderen auf dieselbe
  // Fläche: bei zwei Monitoren sieht man zwei, bei drei drei.
  const addScreen = useCallback(async () => {
    setError("");
    try {
      // Wer zeigt, will auch gesehen werden — die Kamera läuft dabei mit.
      const cam = localStreamRef.current?.getVideoTracks()[0] || (await ensureTrack("video"));
      if (!cam) return;
      if (!cam.enabled) { cam.enabled = true; camRef.current = true; setCamOn(true); }

      const display = await pickScreen();
      let mixer = mixerRef.current;
      if (!mixer) {
        // Der erste Bildschirm legt die gemeinsame Spur an. Sie bleibt für alle
        // weiteren bestehen — deshalb muss nichts neu ausgehandelt werden.
        mixer = createScreenMixer();
        mixerRef.current = mixer;
        screenRef.current = mixer.track;
        for (const [seat, pc] of pcsRef.current.entries()) {
          pc.addTrack(mixer.track, mixer.stream);
          negotiate(seat, pc);
        }
        setMyScreen(mixer.stream);
        setSharing(true);
        roomRef.current?.send({ type: "media", cam: camRef.current, mic: micRef.current, share: true, screenId: mixer.stream.id });
      }

      mixer.add(display);
      screenStreamsRef.current = [...screenStreamsRef.current, display];
      screenLabelRef.current += 1;
      const id = display.id;
      setScreens((prev) => [...prev, { id, label: `Bildschirm ${screenLabelRef.current}` }]);
      // Endet eine Aufnahme von selbst (Fenster geschlossen), verschwindet sie hier.
      display.getVideoTracks()[0].onended = () => removeScreen(id);
    } catch (e) {
      console.error("Bildschirm teilen nicht möglich:", e);
      setError(window.self !== window.top
        ? "Bildschirm teilen ist in der Vorschau blockiert. Öffne die App in einem eigenen Tab — dort funktioniert es."
        : "Bildschirm teilen wurde abgebrochen oder ist nicht erlaubt.");
    }
  }, [ensureTrack, negotiate, removeScreen]);

  const toggleShare = useCallback(async () => {
    if (screenRef.current) { stopShare(); return; }
    await addScreen();
  }, [addScreen, stopShare]);

  const getLocalVideo = useCallback(() => localVideoRef.current, []);

  return {
    status, error, peers, isHost, camOn, micOn,
    attachLocal, toggleCam, toggleMic,
    messages, sendChat, sendChatVoice, sharing, toggleShare, addScreen, removeScreen, screens, mySeat,
    getLocalVideo, myScreen,
    devices, activeDevice, listDevices, switchDevice,
    mode, setMode, watchers, closed,
    invites, createInvite, revokeInvite,
    stage, stageLines, openStage, closeStage, sayOnStage,
  };
}