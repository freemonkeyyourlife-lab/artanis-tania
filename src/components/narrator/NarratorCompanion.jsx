import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Volume2, VolumeX, Square, X, MessageCircle, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { speakAsVoice } from "@/lib/voiceChat";
import { fillLine, BETWEEN_LINES, RECALL_LINES, RECALL_TIPS } from "@/lib/introStory";
import { isQuiet, subscribeQuiet } from "@/lib/onboarding";

// Sie ist immer da: unten im Eck, mit Bild und Namen. Antippen heißt rückrufen —
// sie liest vor und gibt Tipps. Und sie meldet sich zwischendurch von selbst,
// sonst sitzt er vor einer stummen Seite und niemand animiert ihn.
const VOICE_KEY = "artanis_narrator_voice";
const FIRST_AFTER = 45000;
const GAP = 150000;
const BUBBLE_MS = 14000;

export default function NarratorCompanion() {
  const [narrator, setNarrator] = useState(null);
  const [profile, setProfile] = useState(null);
  const [open, setOpen] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [line, setLine] = useState("");
  const [quiet, setQuiet] = useState(() => isQuiet());
  const [muted, setMuted] = useState(() => {
    try {
      return localStorage.getItem(VOICE_KEY) === "off";
    } catch (e) {
      return false;
    }
  });

  const audioRef = useRef(null);
  const runRef = useRef(0);
  const bubbleRef = useRef(null);
  const narratorRef = useRef(null);
  const profileRef = useRef(null);
  const mutedRef = useRef(muted);

  // Wer da ist und mit welcher Stimme sie spricht.
  useEffect(() => {
    (async () => {
      try {
        const res = await base44.entities.Narrator.filter({ active: { $ne: false } }, "order", 1);
        const lead = res?.items?.[0] || null;
        setNarrator(lead);
        let voice = { baseVoice: lead?.voice || "honey" };
        if (lead?.voiceProfileId) {
          const v = await base44.entities.Voice.filter({ id: lead.voiceProfileId });
          if (v?.items?.[0]) voice = v.items[0];
        }
        setProfile(voice);
      } catch (e) {
        /* ohne sie läuft die App trotzdem */
      }
    })();
  }, []);

  useEffect(() => subscribeQuiet(setQuiet), []);

  useEffect(() => {
    narratorRef.current = narrator;
    profileRef.current = profile;
    mutedRef.current = muted;
  }, [narrator, profile, muted]);

  const halt = () => {
    runRef.current += 1;
    audioRef.current?.pause();
    setSpeaking(false);
  };

  const showBubble = (text) => {
    clearTimeout(bubbleRef.current);
    setLine(text);
    bubbleRef.current = setTimeout(() => setLine(""), BUBBLE_MS);
  };

  // Sie sagt ihre Sätze nacheinander — und was sie sagt, steht auch da.
  const speak = async (texts = []) => {
    if (!texts.length) return;
    halt();
    const run = runRef.current;
    const spoken = texts.map((t) => fillLine(t, { narrator: narratorRef.current?.name }));
    showBubble(spoken[spoken.length - 1]);
    if (mutedRef.current || !profileRef.current) return;

    setSpeaking(true);
    const jobs = spoken.map((t) => speakAsVoice(profileRef.current, t, { fast: true }).catch(() => null));
    for (let i = 0; i < spoken.length; i += 1) {
      const url = await jobs[i];
      if (runRef.current !== run) return;
      if (!url) continue;
      await new Promise((resolve) => {
        const audio = new Audio(url);
        audioRef.current = audio;
        audio.onended = resolve;
        audio.onerror = resolve;
        audio.play().catch(resolve);
      });
      if (runRef.current !== run) return;
    }
    if (runRef.current === run) setSpeaking(false);
  };

  const speakRef = useRef(speak);
  speakRef.current = speak;

  // Zwischendurch meldet sie sich — aber nur, wenn er wirklich hinschaut.
  useEffect(() => {
    if (quiet) return undefined;
    const call = () => {
      if (document.hidden) return;
      const text = BETWEEN_LINES[Math.floor(Math.random() * BETWEEN_LINES.length)];
      speakRef.current([text]);
    };
    const first = setTimeout(() => {
      call();
    }, FIRST_AFTER);
    const every = setInterval(call, GAP);
    return () => {
      clearTimeout(first);
      clearInterval(every);
    };
  }, [quiet]);

  useEffect(
    () => () => {
      clearTimeout(bubbleRef.current);
      audioRef.current?.pause();
    },
    []
  );

  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    try {
      localStorage.setItem(VOICE_KEY, next ? "off" : "on");
    } catch (e) {
      /* egal */
    }
    if (next) halt();
    else speak(RECALL_LINES);
  };

  const name = narrator?.name || "Erzählerin";

  if (quiet) return null;

  const face = (size) => (
    <span
      className={cn(
        "relative rounded-full overflow-hidden border-2 border-primary/50 flex-shrink-0",
        size
      )}
    >
      {narrator?.avatar ? (
        <Image src={narrator.avatar} fittingType="fill" className="w-full h-full" />
      ) : (
        <span className="w-full h-full flex items-center justify-center bg-elevated font-display text-primary">
          {name.slice(0, 1)}
        </span>
      )}
    </span>
  );

  return (
    <div className="fixed bottom-24 lg:bottom-6 left-4 z-[70] flex flex-col items-start gap-2">
      {line && !open && (
        <button
          onClick={() => setOpen(true)}
          className="max-w-[min(80vw,300px)] text-left rounded-2xl glass-strong border-2 border-primary/40 px-4 py-3 accent-glow"
        >
          <p className="text-[13px] font-semibold text-foreground leading-relaxed">„{line}"</p>
        </button>
      )}

      {!open && (
        <button
          onClick={() => setOpen(true)}
          title="Sie rückrufen"
          className="flex items-center gap-2 pl-1.5 pr-4 py-1.5 rounded-full glass-strong border-2 border-border hover:border-primary/60 transition-colors"
        >
          {face("w-9 h-9")}
          <span className="text-[13px] font-bold text-foreground">{name}</span>
        </button>
      )}

      {open && (
        <div className="w-[min(92vw,340px)] rounded-2xl glass-strong border-2 border-primary/40 p-4 accent-glow">
          <div className="flex items-center gap-2 mb-3">
            {face("w-8 h-8")}
            <div className="min-w-0">
              <p className="text-[12px] font-bold uppercase tracking-wider text-primary">Sie ist da</p>
              <p className="text-[14px] font-bold text-foreground truncate">{name}</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="ml-auto w-7 h-7 rounded-full bg-elevated flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>

          <div className="space-y-2">
            {RECALL_LINES.map((l, i) => (
              <p key={i} className="text-[14px] font-semibold text-foreground leading-relaxed">
                „{fillLine(l, { narrator: name })}"
              </p>
            ))}
          </div>

          <div className="mt-3 pt-3 border-t-2 border-border">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Ihre Tipps</p>
            <div className="space-y-1.5">
              {RECALL_TIPS.map((t, i) => (
                <p key={i} className="text-[13px] font-semibold text-muted-foreground leading-relaxed">
                  „{t}"
                </p>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3">
            <button
              onClick={speaking ? halt : () => speak(RECALL_LINES)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-btn text-[13px] font-bold text-foreground"
            >
              {speaking ? <Square className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              {speaking ? "Stopp" : "Anhören"}
            </button>
            <button
              onClick={toggleMute}
              title={muted ? "Sie darf wieder sprechen" : "Sie soll still bleiben"}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-btn text-[13px] font-bold text-foreground"
            >
              {muted ? <VolumeX className="w-3.5 h-3.5" /> : <MessageCircle className="w-3.5 h-3.5" />}
              {muted ? "Stumm" : "Sie redet mit"}
            </button>
            <Link
              to="/erzaehler"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold text-muted-foreground hover:text-foreground"
            >
              <Wand2 className="w-3.5 h-3.5" /> Anlegen & ändern
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}