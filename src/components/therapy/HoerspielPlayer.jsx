import React, { useState, useEffect, useRef } from "react";
import { Headphones, Square, Loader2 } from "lucide-react";
import { therapistName } from "@/lib/therapyPrompts";
import { therapyVoiceFor } from "@/lib/therapyVoice";
import { speakAsVoice } from "@/lib/voiceChat";
import { playVolume } from "@/lib/voiceDj";
import { cn } from "@/lib/utils";

// Hörspiel: die ganze Sitzung wie ein Hörspiel vorgelesen — jede Rolle mit
// ihrer eigenen Stimme, und die eigene (aufgenommene) Stimme des Nutzers
// kommt als echte Aufnahme statt als gelesener Text. Im Hörspiel-Modus
// spielt jede neue Antwort von selbst ab.

const pill = (on) =>
  cn(
    "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-colors",
    on ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground"
  );

export default function HoerspielPlayer({ session, messages }) {
  const [auto, setAuto] = useState(() => {
    try { return localStorage.getItem("therapy_hoerspiel") === "1"; } catch { return false; }
  });
  const [playing, setPlaying] = useState(false);
  const tokenRef = useRef(0);
  const audioRef = useRef(null);
  const lastRef = useRef(null);
  const readyRef = useRef(false);

  const toggleAuto = () =>
    setAuto((v) => {
      const n = !v;
      try { localStorage.setItem("therapy_hoerspiel", n ? "1" : "0"); } catch {}
      return n;
    });

  const stop = () => {
    tokenRef.current++;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setPlaying(false);
  };

  const playOne = (msg) =>
    new Promise((resolve) => {
      // Eigene Aufnahme des Nutzers geht als echte Stimme raus — nicht gelesen.
      if (msg.senderType === "USER" && msg.audio) {
        const a = new Audio(msg.audio);
        audioRef.current = a;
        a.onended = () => resolve();
        a.onerror = () => resolve();
        a.play().catch(() => resolve());
        return;
      }
      const name =
        msg.senderName ||
        (msg.senderType === "USER" ? session?.userName || "Du" : therapistName(session));
      const profile = therapyVoiceFor(session, name);
      speakAsVoice(profile, msg.text)
        .then((url) => {
          if (!url) return resolve();
          const a = new Audio(url);
          audioRef.current = a;
          a.volume = playVolume(profile);
          a.onended = () => resolve();
          a.onerror = () => resolve();
          a.play().catch(() => resolve());
        })
        .catch(() => resolve());
    });

  const playList = async (list) => {
    const mine = ++tokenRef.current;
    setPlaying(true);
    for (const m of list) {
      if (mine !== tokenRef.current) return;
      if (m.senderType === "SYSTEM") continue;
      if (!m.text && !m.audio) continue;
      await playOne(m);
    }
    if (mine === tokenRef.current) {
      setPlaying(false);
      audioRef.current = null;
    }
  };

  // Beim ersten Laden merken, was schon da ist — nichts von der Vergangenheit
  // abspielen, nur Neues danach.
  useEffect(() => {
    if (messages.length) lastRef.current = messages[messages.length - 1].id;
    readyRef.current = true;
  }, []);

  // Hörspiel-Modus: jede neue Nachricht wird von selbst vorgespielt.
  useEffect(() => {
    if (!auto || !readyRef.current || !messages.length) return;
    const last = messages[messages.length - 1];
    if (!last || last.id === lastRef.current) return;
    lastRef.current = last.id;
    if (last.senderType === "SYSTEM") return;
    playList([last]);
  }, [auto, messages]);

  useEffect(() => () => stop(), []);

  return (
    <div className="inline-flex items-center gap-1.5">
      <button
        type="button"
        onClick={toggleAuto}
        title="Neue Antworten werden von selbst als Hörspiel vorgespielt — jede Rolle mit ihrer Stimme"
        className={pill(auto)}
      >
        {auto ? "Hörspiel-Modus ✓" : "Hörspiel-Modus"}
      </button>
      <button
        type="button"
        onClick={() => (playing ? stop() : playList(messages))}
        disabled={!messages.length}
        className={pill(playing) + " disabled:opacity-50"}
        title="Die ganze Sitzung als Hörspiel vorlesen — jede Rolle mit ihrer Stimme, deine eigene Aufnahme als echte Stimme"
      >
        {playing ? <Square className="w-3.5 h-3.5" /> : <Headphones className="w-3.5 h-3.5" />}
        {playing ? "Stopp" : "Hörspiel"}
      </button>
    </div>
  );
}