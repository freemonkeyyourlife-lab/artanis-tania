import React, { useEffect, useMemo, useRef, useState } from "react";
import { Check, Loader2, Sparkles, Wand2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import VoiceInput from "@/components/VoiceInput";
import IntroChoiceStep from "@/components/onboarding/IntroChoiceStep";
import IntroShell from "@/components/intro/IntroShell";
import NarratorArrival from "@/components/intro/NarratorArrival";
import IntroModeAsk from "@/components/intro/IntroModeAsk";
import IntroScriptBeat from "@/components/intro/IntroScriptBeat";
import IntroBranchAsk from "@/components/intro/IntroBranchAsk";
import IntroCompanion from "@/components/intro/IntroCompanion";
import { speakAsVoice } from "@/lib/voiceChat";
import { START_PATHS } from "@/lib/onboarding";
import {
  buildIntroFlow,
  fillLine,
  pickByChance,
  setIntroMode,
  setIntroBranch,
  introMode,
  introBranch,
  INTRO_BRANCH,
  INTRO_FRIENDS,
  LANDING_HINT,
} from "@/lib/introStory";

// Der Ablauf des Intros: sie kommt näher, fragt nach dem Modus, stellt ihre
// Fragen und geht dann entweder ins Eck oder führt ihn durch.
export default function IntroRunner({ structure, onFinish }) {
  const [narrators, setNarrators] = useState([]);
  const [voices, setVoices] = useState({});
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState(() => introMode());
  const [branch, setBranch] = useState(() => introBranch());
  const [answers, setAnswers] = useState({ gender: "", orientation: "", wish: "", interests: [], path: "" });
  const [speaking, setSpeaking] = useState(false);
  const [name, setName] = useState("");
  const audioRef = useRef(null);
  const runRef = useRef(0);

  useEffect(() => {
    try {
      setName(localStorage.getItem("display_name") || "");
    } catch (e) {
      /* egal */
    }
  }, []);

  // Wer da ist — und mit welcher Stimme sie spricht.
  useEffect(() => {
    (async () => {
      try {
        const res = await base44.entities.Narrator.filter({ active: { $ne: false } }, "order", 2);
        const items = res?.items || [];
        setNarrators(items);
        const ids = items.map((n) => n.voiceProfileId).filter(Boolean);
        if (ids.length) {
          const v = await base44.entities.Voice.filter({ id: { $in: ids } });
          setVoices(Object.fromEntries((v?.items || []).map((x) => [x.id, x])));
        }
      } catch (e) {
        /* ohne Erzählerin läuft es trotzdem */
      } finally {
        setReady(true);
      }
    })();
  }, []);

  // Glücksprinzip: eine von ihnen kommt näher.
  const lead = useMemo(() => pickByChance(narrators), [narrators]);
  const flow = useMemo(() => buildIntroFlow({ structure, branch }), [structure, branch]);
  const current = flow[Math.min(step, flow.length - 1)] || { kind: "start" };

  const ctx = {
    narrator: lead?.name,
    name,
    friend1: INTRO_FRIENDS[0].name,
    friend2: INTRO_FRIENDS[1].name,
  };

  const stop = () => {
    runRef.current += 1;
    audioRef.current?.pause();
    setSpeaking(false);
  };

  const speak = async (lines = []) => {
    if (!lines.length) return;
    stop();
    const run = runRef.current;
    const profile = voices[lead?.voiceProfileId] || { baseVoice: lead?.voice || structure.guideVoice || "honey" };
    setSpeaking(true);
    for (const line of lines) {
      if (runRef.current !== run) return;
      try {
        const url = await speakAsVoice(profile, fillLine(line, ctx));
        if (runRef.current !== run) return;
        if (!url) continue;
        await new Promise((resolve) => {
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.onended = resolve;
          audio.onerror = resolve;
          audio.play().catch(resolve);
        });
      } catch (e) {
        /* weiter mit der nächsten Zeile */
      }
    }
    if (runRef.current === run) setSpeaking(false);
  };

  const hearsAudio = mode === "AUDIO" || mode === "BOTH";

  // Was auf dem Bildschirm steht, wird auch gesprochen.
  useEffect(() => {
    const lines = current.lines || [];
    if (!lines.length || !hearsAudio) return;
    speak(lines);
    return stop;
  }, [current.id, hearsAudio, lead?.id]);

  const next = () => setStep((s) => Math.min(s + 1, flow.length - 1));
  const back = () => {
    stop();
    setStep((s) => Math.max(0, s - 1));
  };

  const finish = (goTo) => {
    stop();
    const chosen = START_PATHS.find((p) => p.id === answers.path);
    onFinish?.({ ...answers, path: chosen?.label || "" }, goTo || chosen?.to);
  };

  const pickMode = (m) => {
    setIntroMode(m);
    setMode(m);
    next();
  };

  // Die Weiche: sie geht ins Eck — oder die Tour hängt sich ein.
  const pickBranch = (b) => {
    setIntroBranch(b);
    setBranch(b);
    const grown = buildIntroFlow({ structure, branch: b });
    setStep(Math.min(step + 1, grown.length - 1));
  };

  const toggleInterest = (item) =>
    setAnswers((a) => ({
      ...a,
      interests: a.interests.includes(item) ? a.interests.filter((i) => i !== item) : [...a.interests, item],
    }));

  const isLast = current.kind === "start";
  const branchIdx = flow.findIndex((b) => b.id === "branch");
  const showCompanion = !!branch && branchIdx >= 0 && step >= branchIdx;

  if (!ready) {
    return (
      <div className="fixed inset-0 z-[98] flex items-center justify-center bg-background/92">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
      </div>
    );
  }

  const canNext = current.kind !== "mode" || !!mode;

  return (
    <>
      {showCompanion && (
        <IntroCompanion narrator={lead} speaking={speaking} onSpeak={speak} onStop={stop} />
      )}

      <IntroShell
        step={Math.min(step, flow.length - 1)}
        total={flow.length}
        onSkip={() => finish(null)}
        onBack={back}
        onNext={isLast ? () => finish(null) : next}
        nextLabel={isLast ? "Los geht's" : current.kind === "landing" ? "Zeig mir, was hier geht" : "Weiter"}
        canNext={canNext}
      >
        {current.kind === "landing" && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-3">Bevor es losgeht</p>
            <h2 className="font-display text-3xl lg:text-4xl text-foreground text-gloss mb-3">Erzählerinnen erstellen</h2>
            <p className="text-[15px] font-semibold text-muted-foreground mb-5 max-w-xl">{LANDING_HINT}</p>
            <button
              onClick={() => finish("/erzaehler")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass-btn glass-btn-accent text-[15px] font-bold text-gloss"
            >
              <Wand2 className="w-4 h-4" /> Erzählerin erstellen
            </button>
          </div>
        )}

        {current.kind === "arrival" && (
          <NarratorArrival narrator={lead} name={name} onSpeak={speak} onStop={stop} />
        )}

        {(current.kind === "script" || current.kind === "tourStop") && (
          <IntroScriptBeat
            eyebrow={current.eyebrow}
            lines={current.lines}
            ctx={ctx}
            mode={mode}
            speaking={speaking}
            onSpeak={speak}
            onStop={stop}
            note={current.step}
          />
        )}

        {current.kind === "mode" && (
          <IntroModeAsk value={mode} onPick={pickMode} narratorName={lead?.name} />
        )}

        {current.kind === "choice" && (
          <IntroChoiceStep
            eyebrow={current.eyebrow}
            title={current.title}
            hint={current.hint}
            options={current.options}
            value={answers[current.field]}
            onToggle={(v) => setAnswers((a) => ({ ...a, [current.field]: a[current.field] === v ? "" : v }))}
          />
        )}

        {current.kind === "wish" && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-3">Und jetzt du</p>
            <h2 className="font-display text-3xl lg:text-4xl text-foreground text-gloss mb-3">Was möchtest du tun?</h2>
            <p className="text-[15px] font-semibold text-muted-foreground mb-5 max-w-xl">
              Sag es in einem Satz — schreiben oder sprechen. Danach weiß sie, in welche Richtung sie mit dir geht.
            </p>
            <div className="flex items-start gap-2">
              <textarea
                value={answers.wish}
                onChange={(e) => setAnswers((a) => ({ ...a, wish: e.target.value }))}
                rows={2}
                placeholder="Zum Beispiel: Ich will mit Tania reden und dabei zuschauen, wie sie sich verhält."
                className="flex-1 rounded-2xl border-2 border-input bg-transparent px-4 py-3 text-[15px] font-semibold text-foreground resize-none focus:outline-none focus:border-primary"
              />
              <VoiceInput
                onResult={(text) => setAnswers((a) => ({ ...a, wish: a.wish ? `${a.wish} ${text}` : text }))}
                className="w-12 h-12"
              />
            </div>
          </div>
        )}

        {current.kind === "branch" && <IntroBranchAsk onPick={pickBranch} />}

        {current.kind === "interests" && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-3">Kurz zu dir</p>
            <h2 className="font-display text-3xl lg:text-4xl text-foreground text-gloss mb-3">Was interessiert dich?</h2>
            <p className="text-[15px] font-semibold text-muted-foreground mb-5">
              Such dir aus, was passt — gern mehrere. Das merken wir uns, damit du nicht bei null anfängst.
            </p>
            <div className="flex flex-wrap gap-2">
              {(structure.interestOptions || []).map((item) => {
                const on = answers.interests.includes(item);
                return (
                  <button
                    key={item}
                    onClick={() => toggleInterest(item)}
                    className={cn(
                      "inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-[14px] font-bold transition-colors border-2",
                      on ? "glass-btn glass-btn-accent border-transparent text-gloss" : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {on && <Check className="w-3.5 h-3.5" />}
                    {item}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isLast && (
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary mb-3">Los geht's</p>
            <h2 className="font-display text-3xl lg:text-4xl text-foreground text-gloss mb-5">Wo willst du anfangen?</h2>
            <div className="grid gap-3 sm:grid-cols-3">
              {START_PATHS.map((p) => {
                const on = answers.path === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setAnswers((a) => ({ ...a, path: on ? "" : p.id }))}
                    className={cn(
                      "text-left rounded-2xl border-2 p-4 transition-colors",
                      on ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                    )}
                  >
                    <Sparkles className="w-4 h-4 text-primary mb-2" />
                    <p className="font-display text-[16px] text-foreground">{p.label}</p>
                    <p className="text-[13px] font-semibold text-muted-foreground mt-1">{p.hint}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </IntroShell>
    </>
  );
}