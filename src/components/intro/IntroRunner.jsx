import React, { useEffect, useRef, useState } from "react";
import { Check, Sparkles, Wand2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import VoiceInput from "@/components/VoiceInput";
import IntroChoiceStep from "@/components/onboarding/IntroChoiceStep";
import IntroShell from "@/components/intro/IntroShell";
import NarratorArrival from "@/components/intro/NarratorArrival";
import IntroModeAsk from "@/components/intro/IntroModeAsk";
import IntroScriptBeat from "@/components/intro/IntroScriptBeat";
import IntroBranchAsk from "@/components/intro/IntroBranchAsk";
import IntroBuildKit from "@/components/intro/IntroBuildKit";
import IntroCompanion from "@/components/intro/IntroCompanion";
import IntroVoiceBar from "@/components/intro/IntroVoiceBar";
import { speakAsVoice, prefetchSpeech } from "@/lib/voiceChat";
import { matchIntroVoice } from "@/lib/introVoice";
import { fileMissingWish } from "@/lib/introArchive";
import { START_PATHS } from "@/lib/onboarding";
import {
  buildIntroFlow,
  fillLine,
  optionLines,
  pickByChance,
  setIntroMode,
  setIntroBranch,
  introMode,
  introBranch,
  INTRO_FRIENDS,
  INTRO_MODES,
  INTRO_TAKT,
  BUILDKIT_AXES,
  BRANCH_OPTIONS,
  ARCHIVED_LINES,
  LANDING_HINT,
} from "@/lib/introStory";

// Der Ablauf des Intros. Sie fängt sofort an zu reden — die Daten für ihre
// Stimme werden im Hintergrund geholt, nicht davor. Sie liest vor, was es gibt;
// er antwortet mit der Stimme und muss nichts anklicken. Wer den Tipp-Modus
// gewählt hat, tippt und klickt wie gewohnt.
export default function IntroRunner({ structure, onFinish }) {
  const [lead, setLead] = useState(null);
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState(() => introMode());
  const [branch, setBranch] = useState(() => introBranch());
  const [kitAxis, setKitAxis] = useState(0);
  const [kit, setKit] = useState({});
  const [heard, setHeard] = useState(null);
  const [answers, setAnswers] = useState({ gender: "", orientation: "", wish: "", interests: [], path: "" });
  const [speaking, setSpeaking] = useState(false);
  const [revealed, setRevealed] = useState(0);
  const [name, setName] = useState("");

  const audioRef = useRef(null);
  const runRef = useRef(0);
  const leadRef = useRef(null);
  const voicesRef = useRef({});
  const loadRef = useRef(Promise.resolve());

  useEffect(() => {
    try {
      setName(localStorage.getItem("display_name") || "");
    } catch (e) {
      /* egal */
    }
  }, []);

  // Wer da ist und mit welcher Stimme sie spricht. Läuft im Hintergrund: das
  // Fenster steht sofort, gesprochen wird, sobald die Stimme da ist.
  useEffect(() => {
    loadRef.current = (async () => {
      try {
        const res = await base44.entities.Narrator.filter({ active: { $ne: false } }, "order", 2);
        const items = res?.items || [];
        const ids = items.map((n) => n.voiceProfileId).filter(Boolean);
        if (ids.length) {
          const v = await base44.entities.Voice.filter({ id: { $in: ids } });
          voicesRef.current = Object.fromEntries((v?.items || []).map((x) => [x.id, x]));
        }
        const chosen = pickByChance(items);
        leadRef.current = chosen;
        setLead(chosen);
      } catch (e) {
        /* ohne Erzählerin läuft es trotzdem */
      }
    })();
  }, []);

  const flow = React.useMemo(() => buildIntroFlow({ structure, branch }), [structure, branch]);
  const current = flow[Math.min(step, flow.length - 1)] || { kind: "start" };
  const hearsAudio = mode === "AUDIO" || mode === "BOTH";

  const ctx = {
    narrator: lead?.name,
    name,
    friend1: INTRO_FRIENDS[0].name,
    friend2: INTRO_FRIENDS[1].name,
  };

  const profileFor = (person) =>
    voicesRef.current[person?.voiceProfileId] || { baseVoice: person?.voice || structure.guideVoice || "honey" };

  const halt = () => {
    runRef.current += 1;
    audioRef.current?.pause();
    setSpeaking(false);
  };

  // Alles stehen lassen, was sie gesagt hat — Stopp darf nichts verschlucken.
  const stop = () => {
    halt();
    setRevealed((n) => Math.max(n, lines.length));
  };

  const speak = async (texts = [], { reveal = false } = {}) => {
    if (!texts.length) return;
    halt();
    const run = runRef.current;
    if (reveal) setRevealed(0);

    await loadRef.current;
    const profile = profileFor(leadRef.current);
    const spoken = texts.map((t) => fillLine(t, ctx));

    // Alle Zeilen gleichzeitig anfordern: die erste kommt zuerst, die nächsten
    // sind längst fertig, wenn sie dran sind. Kein Loch zwischen den Sätzen.
    const jobs = spoken.map((line) => speakAsVoice(profile, line, { fast: true }).catch(() => null));

    setSpeaking(true);
    for (let i = 0; i < spoken.length; i += 1) {
      const url = await jobs[i];
      if (runRef.current !== run) return;
      if (reveal) setRevealed(i + 1);
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
    if (runRef.current === run) {
      setSpeaking(false);
      // Den nächsten Baustein vorbereiten — dann ist „Weiter" sofort da.
      const nextBeat = flow[step + 1];
      if (nextBeat?.lines?.length) prefetchSpeech(profile, nextBeat.lines.map((l) => fillLine(l, ctx)));
    }
  };

  // Der Baukasten führt ihn Schraube für Schraube — sie liest jede vor.
  const kitLines = React.useMemo(() => {
    const axis = BUILDKIT_AXES[kitAxis];
    return axis ? optionLines(axis.question, axis.options) : [];
  }, [kitAxis]);

  const lines = current.kind === "baukasten" ? kitLines : current.lines || [];
  const beatKey = current.kind === "baukasten" ? `${current.id}-${kitAxis}` : current.id;

  // Was auf dem Bildschirm steht, wird gesprochen — und gibt den Takt vor.
  useEffect(() => {
    setHeard(null);
    setRevealed(0);
    if (!lines.length) return;
    if (hearsAudio) {
      speak(lines, { reveal: true });
      return halt;
    }
    // Ohne Ton kommt der Takt aus der Zeit.
    const timers = lines.map((_, i) => setTimeout(() => setRevealed(i + 1), INTRO_TAKT.line * (i + 1)));
    return () => timers.forEach(clearTimeout);
  }, [beatKey, hearsAudio, lead?.id]);

  // Was sie ihm gerade anbietet — er kann es einfach sagen.
  const voiceOptions = React.useMemo(() => {
    if (!hearsAudio) return [];
    if (current.kind === "mode") return INTRO_MODES.map((m) => ({ id: m.id, label: m.label }));
    if (current.kind === "choice") return (current.options || []).map((o) => ({ id: o, label: o }));
    if (current.kind === "branch") return BRANCH_OPTIONS.map((o) => ({ id: o.id, label: o.label }));
    if (current.kind === "start") return START_PATHS.map((p) => ({ id: p.id, label: p.label }));
    if (current.kind === "interests") return (structure.interestOptions || []).map((o) => ({ id: o, label: o }));
    if (current.kind === "baukasten") return (BUILDKIT_AXES[kitAxis]?.options || []).map((o) => ({ id: o.id, label: o.label }));
    return [];
  }, [current, hearsAudio, kitAxis, structure]);

  const next = () => {
    if (current.kind === "baukasten" && kitAxis < BUILDKIT_AXES.length - 1) {
      setKitAxis((k) => k + 1);
      return;
    }
    setStep((s) => Math.min(s + 1, flow.length - 1));
  };

  const back = () => {
    halt();
    if (current.kind === "baukasten" && kitAxis > 0) {
      setKitAxis((k) => k - 1);
      return;
    }
    setStep((s) => Math.max(0, s - 1));
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

  const pickKit = (axisId, optionId) => {
    setKit((k) => ({ ...k, [axisId]: k[axisId] === optionId ? "" : optionId }));
  };

  // Was er gesagt hat, gilt für das, was gerade dasteht.
  const applyVoice = (id) => {
    if (current.kind === "mode") return pickMode(id);
    if (current.kind === "choice") return setAnswers((a) => ({ ...a, [current.field]: a[current.field] === id ? "" : id }));
    if (current.kind === "branch") return pickBranch(id);
    if (current.kind === "start") return setAnswers((a) => ({ ...a, path: a.path === id ? "" : id }));
    if (current.kind === "interests") return toggleInterest(id);
    if (current.kind === "baukasten") return pickKit(BUILDKIT_AXES[kitAxis].id, id);
  };

  const handleVoice = (text) => {
    const hit = matchIntroVoice(text, voiceOptions);
    setHeard({ text, ok: !!hit });
    if (!hit) return;
    if (hit.type === "stop") return stop();
    if (hit.type === "back") return back();
    if (hit.type === "next") return next();
    if (hit.type === "option") applyVoice(hit.id);
  };

  // Was es noch nicht gibt, wird aufgenommen — und sie bestätigt es ihm.
  const archiveWish = async (text, combination) => {
    await fileMissingWish({ text, name, interests: answers.interests, combination });
    speak(ARCHIVED_LINES);
  };

  const finish = (goTo) => {
    halt();
    const chosen = START_PATHS.find((p) => p.id === answers.path);
    onFinish?.({ ...answers, baukasten: kit, path: chosen?.label || "" }, goTo || chosen?.to);
  };

  const isLast = current.kind === "start";
  const branchIdx = flow.findIndex((b) => b.id === "branch");
  const showCompanion = !!branch && branchIdx >= 0 && step >= branchIdx;

  return (
    <>
      {showCompanion && <IntroCompanion narrator={lead} speaking={speaking} onSpeak={speak} onStop={stop} />}

      <IntroShell
        step={Math.min(step, flow.length - 1)}
        total={flow.length}
        onSkip={() => finish(null)}
        onBack={back}
        onNext={isLast ? () => finish(null) : next}
        nextLabel={isLast ? "Los geht's" : current.kind === "landing" ? "Zeig mir, was hier geht" : "Weiter"}
        canNext={current.kind !== "mode" || !!mode}
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
          <NarratorArrival narrator={lead} name={name} onSpeak={speak} onStop={halt} />
        )}

        {(current.kind === "script" || current.kind === "tourStop") && (
          <IntroScriptBeat
            eyebrow={current.eyebrow}
            lines={lines}
            revealed={revealed}
            ctx={ctx}
            mode={mode}
            speaking={speaking}
            onSpeak={speak}
            onStop={stop}
            note={current.step}
          />
        )}

        {current.kind === "mode" && <IntroModeAsk value={mode} onPick={pickMode} narratorName={lead?.name} />}

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

        {current.kind === "baukasten" && (
          <IntroBuildKit
            axis={kitAxis}
            values={kit}
            onPick={pickKit}
            onAxis={setKitAxis}
            onArchive={archiveWish}
          />
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

        <IntroVoiceBar options={voiceOptions} heard={heard} onSay={handleVoice} />
      </IntroShell>
    </>
  );
}