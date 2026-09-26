import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Mic, Square, PhoneOff, Loader2, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { hasProAccess } from "@/lib/proAccess";
import { APPEARANCE_DIRECTIVE, CARTOON_STYLE, IMAGE_CONSISTENCY, PHOTOREAL } from "@/lib/appearance";

const LANGUAGE_RULE =
  "Du bist in einem VIDEOCHAT und sprichst laut. Antworte deshalb IMMER auf Deutsch, in der Du-Form, kurz und gesprochen — 1 bis 3 Sätze, wie ein echter Mensch am Telefon. Keine Aufzählungen, keine Regieanweisungen, kein Sternchen-Text, keine Emojis. Nur das, was du wirklich sagen würdest.";

// Videochat mit einem KI-Charakter: sie spricht, du sprichst, das Bild lebt.
export default function AiVideoCall() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [creator, setCreator] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [frame, setFrame] = useState(null);
  const [line, setLine] = useState("");
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [text, setText] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [history, setHistory] = useState([]);
  const [camReady, setCamReady] = useState(false);

  const selfRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioRef = useRef(null);

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    try {
      const c = await base44.entities.Creator.get(id);
      setCreator(c);
      setFrame(c.avatar || c.referenceImages?.[0] || null);
      try { setUser(await base44.auth.me()); } catch (e) { /* Besucher ohne Konto */ }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Eigene Kamera als kleines Fenster — sie sieht dich.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (selfRef.current) selfRef.current.srcObject = stream;
        setCamReady(true);
      } catch (e) { /* Kamera nicht erlaubt */ }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      audioRef.current?.pause();
    };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const proActive = hasProAccess(user);

  const speak = async (t) => {
    try {
      const res = await base44.integrations.Core.GenerateSpeech({ text: t, voice: creator?.voice || undefined });
      if (!res?.url) return;
      audioRef.current?.pause();
      const audio = new Audio(res.url);
      audioRef.current = audio;
      audio.play().catch(() => {});
    } catch (e) { /* Stimme optional */ }
  };

  const newFrame = async (desc) => {
    const refs = [creator?.avatar, ...(creator?.referenceImages || [])].filter(Boolean).slice(0, 4);
    const style = creator?.artStyle === "CARTOON" ? CARTOON_STYLE : PHOTOREAL;
    try {
      const res = await base44.integrations.Core.GenerateImage({
        prompt: `${style}${APPEARANCE_DIRECTIVE} ${IMAGE_CONSISTENCY} Videochat-Kamera: ${creator?.stageName} sitzt vor der Kamera und redet. ${desc}`,
        existing_image_urls: refs.length ? refs : undefined,
      });
      if (res?.url) setFrame(res.url);
    } catch (e) { /* altes Bild bleibt stehen */ }
  };

  const reply = async (userText) => {
    setBusy(true);
    try {
      const hist = history.slice(-8).map((h) => `${h.role === "user" ? "Er" : "Du"}: ${h.text}`).join("\n");
      const prompt =
        LANGUAGE_RULE +
        `\n\nDu bist ${creator?.stageName}. ${creator?.bio || ""}` +
        `\n\nDas hier ist ein Videochat — du siehst ihn vor dir. Sei präsent, frag nach, halte das Gespräch am Laufen, werde langsam deutlicher und direkter.` +
        (hist ? `\n\nBISHER:\n${hist}` : "") +
        (userText ? `\n\nEr sagt gerade: "${userText}"` : "\n\nDu hebst gerade ab — begrüße ihn kurz und persönlich.");
      const res = await base44.integrations.Core.InvokeLLM({ prompt });
      const said = typeof res === "string" ? res : (res.response || res.text || res.output || "");
      const clean = said.replace(/[*_#`]/g, "").trim();
      setLine(clean);
      setHistory((h) => [...h, ...(userText ? [{ role: "user", text: userText }] : []), { role: "ai", text: clean }]);
      await speak(clean);
      newFrame(clean.slice(0, 160));
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  // Beim Öffnen hebt sie ab.
  useEffect(() => {
    if (creator && !history.length && !line) reply("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [creator]);

  const toggleMic = async () => {
    if (recording) {
      recorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        setTranscribing(true);
        try {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          const file = new File([blob], "voice.webm", { type: "audio/webm" });
          const up = await base44.integrations.Core.UploadPublicFile({ file });
          const tr = await base44.integrations.Core.TranscribeAudio({ audio_url: up.file_url });
          const said = typeof tr === "string" ? tr : (tr.transcript || tr.text || tr.output || "");
          if (said) reply(said);
        } catch (e) { console.error(e); } finally { setTranscribing(false); }
      };
      recorderRef.current = rec;
      rec.start();
      setRecording(true);
    } catch (e) { console.error(e); }
  };

  const sendText = () => {
    const t = text.trim();
    if (!t || busy) return;
    setText("");
    reply(t);
  };

  const hangUp = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    audioRef.current?.pause();
    navigate(-1);
  };

  const clock = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  if (loading) {
    return <div className="fixed inset-0 flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!proActive) {
    return (
      <div className="fixed inset-0 bg-background flex items-center justify-center p-6">
        <div className="max-w-sm text-center">
          <Lock className="w-10 h-10 text-primary mx-auto mb-4" />
          <h1 className="font-display text-2xl text-foreground mb-2">Videochat</h1>
          <p className="text-sm text-muted-foreground">Videochat ist ein Pro-Feature. Mit Pro-Zugang ist es für dich frei.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm font-medium">{creator?.stageName}</span>
        </div>
        <span className="text-xs text-white/60">{clock}</span>
      </div>

      <div className="relative flex-1 overflow-hidden">
        {frame ? (
          <Image src={frame} fittingType="fill" className="absolute inset-0 w-full h-full" />
        ) : (
          <div className="absolute inset-0 bg-elevated" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40" />

        <div className="absolute top-4 right-4 w-28 h-40 sm:w-36 sm:h-48 rounded-2xl overflow-hidden border border-white/20 bg-black/60">
          <video ref={selfRef} autoPlay muted playsInline className="w-full h-full object-cover" />
          {!camReady && <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white/50 text-center px-2">Kamera aus</div>}
        </div>

        {(busy || transcribing) && (
          <div className="absolute top-4 left-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 text-white text-xs">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {transcribing ? "Ich höre dich …" : "Sie überlegt …"}
          </div>
        )}

        {line && (
          <div className="absolute bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md">
            <p className="text-white text-sm sm:text-base leading-snug drop-shadow">{line}</p>
          </div>
        )}
      </div>

      <div className="px-4 py-4 flex items-center gap-2 bg-black">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendText()}
          placeholder="Oder schreiben …"
          className="flex-1 px-4 py-2.5 rounded-full bg-white/10 border border-white/15 text-sm text-white placeholder:text-white/40 focus:outline-none"
        />
        <button
          onClick={toggleMic}
          disabled={busy}
          className={cn(
            "w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
            recording ? "bg-red-500 text-white animate-pulse" : "bg-white/10 text-white hover:bg-white/20"
          )}
        >
          {recording ? <Square className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
        <button onClick={hangUp} className="w-11 h-11 rounded-full bg-red-600 text-white flex items-center justify-center flex-shrink-0">
          <PhoneOff className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}