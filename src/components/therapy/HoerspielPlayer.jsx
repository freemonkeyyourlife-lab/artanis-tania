import React, { useState, useEffect, useRef } from "react";
import { Headphones, Play, Pause, SkipBack, SkipForward, Square } from "lucide-react";
import { therapistName } from "@/lib/therapyPrompts";
import { therapyVoiceFor } from "@/lib/therapyVoice";
import { speakAsVoice } from "@/lib/voiceChat";
import { playVolume } from "@/lib/voiceDj";
import { cn } from "@/lib/utils";

// Hörspiel: die ganze Sitzung wie ein Hörspiel vorgelesen — jede Rolle mit
// ihrer eigenen Stimme, und die eigene (aufgenommene) Stimme des Nutzers
// kommt als echte Aufnahme statt als gelesener Text. Mit Skip, Play/Pause
// und Stopp. Im Hörspiel-Modus spielt jede neue Antwort von selbst ab.

const pill = (on) =>
  cn(
    "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[11px] font-semibold transition-colors",
    on ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground"
  );

const ctrl =
  "w-8 h-8 rounded-full bg-elevated text-muted-foreground hover:text-foreground flex items-center justify-center transition-colors disabled:opacity-40";

export default function HoerspielPlayer({ session, messages }) {
  const [auto, setAuto] = useState(() => {
    try { return localStorage.getItem("therapy_hoerspiel") === "1"; } catch { return false; }
  });
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [skipMine, setSkipMine] = useState(() => {
    try { return localStorage.getItem("therapy_skipmine") === "1"; } catch { return false; }
  });
  const toggleSkipMine = () =>
    setSkipMine((v) => {
      const n = !v;
      try { localStorage.setItem("therapy_skipmine", n ? "1" : "0"); } catch {}
      return n;
    });
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

  const playOne = (msg) =>
    new Promise((resolve) => {
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

  const playable = (m) => m.senderType !== "SYSTEM" && (m.text || m.audio);
  const isSkipped = (m) => skipMine && m.senderType === "USER";

  const run = async (start, mine) => {
    for (let i = start; i < messages.length; i++) {
      if (mine !== tokenRef.current) return;
      setIndex(i);
      if (!playable(messages[i]) || isSkipped(messages[i])) continue;
      await playOne(messages[i]);
      if (mine !== tokenRef.current) return;
    }
    if (mine === tokenRef.current) {
      setPlaying(false);
      setIndex(-1);
    }
  };

  const playFrom = (i) => {
    tokenRef.current++;
    const mine = tokenRef.current;
    setIndex(i);
    setPlaying(true);
    run(i, mine);
  };

  const playSingle = (i) => {
    tokenRef.current++;
    const mine = tokenRef.current;
    setIndex(i);
    setPlaying(true);
    (async () => {
      await playOne(messages[i]);
      if (mine === tokenRef.current) setPlaying(false);
    })();
  };

  const pause = () => {
    tokenRef.current++;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setPlaying(false);
  };

  const stop = () => {
    pause();
    setIndex(-1);
  };

  const toggle = () => {
    if (playing) pause();
    else playFrom(index >= 0 ? index : 0);
  };

  const next = () => {
    let ni = index + 1;
    while (ni < messages.length && !playable(messages[ni])) ni++;
    if (ni >= messages.length) return;
    if (playing) playFrom(ni);
    else setIndex(ni);
  };

  const prev = () => {
    let pi = Math.max(0, index - 1);
    while (pi > 0 && !playable(messages[pi])) pi--;
    if (playing) playFrom(pi);
    else setIndex(pi);
  };

  useEffect(() => {
    const last = messages.length ? messages[messages.length - 1].id : null;
    lastRef.current = last;
    readyRef.current = true;
  }, []);

  // Hörspiel-Modus: jede neue Nachricht wird von selbst vorgespielt.
  useEffect(() => {
    if (!auto || !readyRef.current || !messages.length) return;
    const last = messages[messages.length - 1];
    if (!last || last.id === lastRef.current) return;
    lastRef.current = last.id;
    if (!playable(last) || isSkipped(last)) return;
    const i = messages.length - 1;
    playSingle(i);
  }, [auto, messages]);

  useEffect(() => () => pause(), []);

  return (
    <div className="inline-flex items-center gap-1.5 flex-wrap">
      <button type="button" onClick={toggleAuto} className={pill(auto)} title="Neue Antworten werden von selbst vorgespielt">
        {auto ? "Hörspiel-Modus ✓" : "Hörspiel-Modus"}
      </button>
      <div className="inline-flex items-center gap-1 rounded-full bg-elevated px-1 py-0.5">
        <button type="button" onClick={prev} disabled={!messages.length} className={ctrl} title="Zurück">
          <SkipBack className="w-3.5 h-3.5" />
        </button>
        <button type="button" onClick={toggle} disabled={!messages.length} className={cn(ctrl, "bg-primary text-primary-foreground hover:brightness-110")} title={playing ? "Pause" : "Abspielen"}>
          {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>
        <button type="button" onClick={next} disabled={!messages.length} className={ctrl} title="Weiter">
          <SkipForward className="w-3.5 h-3.5" />
        </button>
        {playing && (
          <span className="text-[10px] text-muted-foreground px-1 tabular-nums">
            {index >= 0 ? index + 1 : 0}/{messages.length}
          </span>
        )}
        <button type="button" onClick={stop} disabled={!messages.length} className={ctrl} title="Stopp">
          <Square className="w-3 h-3" />
        </button>
      </div>
      <button type="button" onClick={toggleSkipMine} className={pill(skipMine)} title="Deine eigene Stimme überspringen — bis du sie wieder loslässt">
        {skipMine ? "Meine Stimme überspringen ✓" : "Meine Stimme überspringen"}
      </button>
    </div>
  );
}