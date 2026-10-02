import React, { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import {
  Sparkles, Loader2, RotateCcw, Check, ArrowRight, Lightbulb, Users, MapPin, Plus, ShoppingBag,
} from "lucide-react";

import { useToast } from "@/components/ui/use-toast";
import VoiceInput from "@/components/VoiceInput";
import { cn } from "@/lib/utils";
import { draftFromWish } from "@/lib/assistantWish";
import NarratorPicker from "@/components/studio/assistant/NarratorPicker";
import NarratorLines from "@/components/studio/assistant/NarratorLines";

const EXAMPLES = [
  "Sie soll mich heute Abend überraschen und mich nicht mehr loslassen.",
  "Ein ruhiges Gespräch, das langsam außer Kontrolle gerät.",
  "Ich will, dass sie mich aushorcht und mehr über mich wissen will, als ich sagen wollte.",
];

// "Sag was du willst": tippen oder sprechen — daraus wird ein Vorschlag mit
// Szenario und Besetzung. Die Erzählerin begleitet bis zum Start.
export default function AssistantWishMode({ creators = [], experiences = [], contents = [], onChanged }) {
  const { toast } = useToast();
  const [wish, setWish] = useState("");
  const [draft, setDraft] = useState(null);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState("wish");
  const [made, setMade] = useState(null);
  const [narrators, setNarrators] = useState([]);
  const [speaking, setSpeaking] = useState(false);
  const audioRef = useRef(null);
  const runRef = useRef(0);

  useEffect(() => () => audioRef.current?.pause(), []);

  const stop = () => {
    runRef.current += 1;
    audioRef.current?.pause();
    setSpeaking(false);
  };

  // Jede Zeile mit ihrer eigenen Stimme. Wird der Ton blockiert, bleibt der Text stehen.
  const playLines = async (lines) => {
    if (!lines?.length) return;
    stop();
    const run = runRef.current;
    setSpeaking(true);
    for (const line of lines) {
      if (runRef.current !== run) return;
      const person = narrators[line.who] || narrators[0];
      try {
        const res = await base44.integrations.Core.GenerateSpeech({ text: line.text, voice: person?.voice || "honey" });
        if (runRef.current !== run) return;
        await new Promise((resolve) => {
          const audio = new Audio(res.url);
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

  const draftNow = async () => {
    const text = wish.trim();
    if (!text || busy) return;
    setBusy(true);
    setDraft(null);
    setStage("wish");
    try {
      const res = await draftFromWish({
        wish: text,
        creators,
        experiences,
        contents,
        narrators,
        avoid: draft?.title || "",
      });
      setDraft(res);
      setStage("proposal");
      playLines(res.lines || []);
    } catch (e) {
      toast({ title: "Sie hat gerade nichts gefunden", description: "Versuch es nochmal.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  // Übernehmen: fehlende Figuren anlegen, Szenario nehmen oder neu anlegen.
  const apply = async () => {
    if (!draft || busy) return;
    setBusy(true);
    try {
      const known = new Set(creators.map((c) => c.id));
      let leadId = "";
      let leadName = "";

      for (const person of draft.cast || []) {
        if (person.existingId && known.has(person.existingId)) {
          if (!leadId) {
            leadId = person.existingId;
            leadName = creators.find((c) => c.id === person.existingId)?.stageName || person.name;
          }
          continue;
        }
        const created = await base44.entities.Creator.create({
          stageName: person.name,
          personaType: person.personaType || "SOLO_FEMALE",
          creatorCategory: "AI_MODEL",
          artStyle: person.artStyle || "PHOTOREAL",
          tagline: person.role || "",
          bio: person.note || "",
          shortStory: person.role || "",
          personaPrompt: [person.role, person.note].filter(Boolean).join(" "),
          active: true,
        });
        if (!leadId) {
          leadId = created.id;
          leadName = person.name;
        }
      }

      let experienceId = draft.experienceId || "";
      if (!experienceId) {
        const exp = await base44.entities.Experience.create({
          creatorId: leadId,
          creatorName: leadName,
          title: draft.title,
          description: draft.scenario,
          experienceType: "AI_INTERACTIVE",
          published: false,
        });
        experienceId = exp.id;
      }

      setMade({
        experienceId,
        startPath: draft.startKind === "SZENE" ? "/interactive" : "/messages",
      });
      setStage("ready");
      onChanged?.();
    } catch (e) {
      toast({ title: "Hat nicht geklappt", description: "Versuch es noch einmal.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const restart = () => {
    stop();
    setDraft(null);
    setMade(null);
    setStage("wish");
  };

  if (stage === "wish") {
    return (
      <div className="space-y-4">
        <div>
          <p className="font-display text-xl text-foreground mb-1 inline-flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" /> Sag, was du willst
          </p>
          <p className="text-[15px] font-semibold text-muted-foreground max-w-2xl">
            Schreib es hin oder sprich es einfach aus. Die Erzählerin macht daraus ein Szenario, stellt die Besetzung
            zusammen und begleitet dich bis zum Start.
          </p>
        </div>

        <div className="rounded-2xl border-2 border-border bg-card p-4">
          <textarea
            value={wish}
            onChange={(e) => setWish(e.target.value)}
            rows={4}
            placeholder="Zum Beispiel: Ich will, dass sie mich aushorcht …"
            className="w-full px-4 py-3 rounded-xl bg-background border border-border text-[15px] text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/50"
          />
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <VoiceInput onResult={(t) => setWish((prev) => (prev ? `${prev} ${t}` : t))} disabled={busy} title="Wunsch reinsprechen" />
            <span className="text-[12px] font-semibold text-muted-foreground">oder reinsprechen</span>
            <button
              onClick={draftNow}
              disabled={!wish.trim() || busy}
              className="ml-auto inline-flex items-center gap-2 px-6 py-2.5 rounded-full glass-btn glass-btn-accent text-[14px] font-bold text-gloss disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {busy ? "Sie überlegt …" : "Vorschlag holen"}
            </button>
          </div>
        </div>

        <NarratorPicker value={narrators} onChange={setNarrators} />

        <div className="flex flex-wrap gap-2">
          {EXAMPLES.map((e) => (
            <button
              key={e}
              onClick={() => setWish(e)}
              className="px-4 py-2 rounded-full glass-btn text-[13px] font-semibold text-muted-foreground hover:text-foreground"
            >
              {e}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (stage === "proposal" && draft) {
    const known = new Set(creators.map((c) => c.id));
    const reuse = experiences.find((e) => e.id === draft.experienceId);

    return (
      <div className="space-y-4">
        <NarratorLines
          lines={draft.lines || []}
          people={narrators}
          speaking={speaking}
          onSpeak={() => playLines(draft.lines || [])}
          onStop={stop}
        />

        <div className="rounded-2xl border-2 border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
            <div>
              <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground">Ihr Vorschlag</p>
              <p className="font-display text-2xl text-foreground">{draft.title}</p>
            </div>
            {draft.mood && (
              <span className="px-3 py-1.5 rounded-full bg-primary/15 text-primary text-[12px] font-bold">{draft.mood}</span>
            )}
          </div>

          <p className="text-[15px] font-semibold text-muted-foreground leading-relaxed">{draft.scenario}</p>

          <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mt-5 mb-2 inline-flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> Besetzung
          </p>
          <div className="space-y-2">
            {(draft.cast || []).map((person, i) => {
              const has = person.existingId && known.has(person.existingId);
              return (
                <div key={`${person.name}-${i}`} className="flex items-start gap-3 p-3 rounded-xl bg-elevated border border-border">
                  <span
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-bold",
                      has ? "bg-emerald-600/20 text-emerald-400" : "bg-primary/20 text-primary"
                    )}
                  >
                    {has ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-foreground">
                      {person.name}
                      <span className="ml-2 text-[11px] font-bold text-muted-foreground">
                        {has ? "aus deinen Charakteren" : "wird neu angelegt"}
                      </span>
                    </p>
                    {person.role && <p className="text-[13px] font-semibold text-muted-foreground">{person.role}</p>}
                    {!has && person.note && <p className="text-[12px] text-muted-foreground mt-1">{person.note}</p>}
                  </div>
                </div>
              );
            })}
          </div>

          <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mt-5 mb-1 inline-flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> Szenario
          </p>
          <p className="text-[14px] font-semibold text-foreground">
            {reuse ? `Wird genommen: ${reuse.title}` : "Wird neu angelegt"}
            <span className="ml-2 text-[12px] font-bold text-muted-foreground">
              · Start im {draft.startKind === "SZENE" ? "interaktiven Spiel" : "privaten Chat"}
            </span>
          </p>

          {draft.tip && (
            <div className="mt-5 rounded-2xl border border-border bg-background/60 p-4">
              <p className="text-[12px] font-bold uppercase tracking-wider text-primary mb-1 inline-flex items-center gap-1.5">
                <Lightbulb className="w-3.5 h-3.5" /> Geheimtipp
              </p>
              <p className="text-[14px] font-semibold text-muted-foreground leading-relaxed">{draft.tip}</p>
            </div>
          )}

          {(draft.advice || []).length > 0 && (
            <div className="mt-4 rounded-2xl border border-border bg-background/60 p-4">
              <p className="text-[12px] font-bold uppercase tracking-wider text-primary mb-1 inline-flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5" /> Sie legt dir dazu
              </p>
              {draft.pitch && <p className="text-[14px] font-semibold text-muted-foreground leading-relaxed mb-3">{draft.pitch}</p>}
              <div className="space-y-2">
                {draft.advice.map((a) => (
                  <Link
                    key={a.path}
                    to={a.path}
                    className="flex items-start gap-3 p-3 rounded-xl bg-elevated border border-border hover:border-primary/50 transition-colors"
                  >
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
                      <ArrowRight className="w-3 h-3" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[14px] font-bold text-foreground">{a.label}</span>
                      {a.why && <span className="block text-[13px] font-semibold text-muted-foreground">{a.why}</span>}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={restart}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[14px] font-bold text-muted-foreground"
          >
            <RotateCcw className="w-4 h-4" /> Anders sagen
          </button>
          <button
            onClick={draftNow}
            disabled={busy}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[14px] font-bold text-foreground disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Anderer Vorschlag
          </button>
          <button
            onClick={apply}
            disabled={busy}
            className="ml-auto inline-flex items-center gap-2 px-6 py-2.5 rounded-full glass-btn glass-btn-accent text-[14px] font-bold text-gloss disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} So machen
          </button>
        </div>
      </div>
    );
  }

  const closing = [
    {
      who: 0,
      text: `Es steht. ${draft?.title ? `„${draft.title}" ` : ""}Ich bin dabei — und ich verrate dir unterwegs noch das eine oder andere. Geh rein, sie wartet schon.`,
    },
  ];

  return (
    <div className="space-y-4">
      <NarratorLines
        lines={closing}
        people={narrators}
        speaking={speaking}
        onSpeak={() => playLines(closing)}
        onStop={stop}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to={made?.startPath || "/messages"}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass-btn glass-btn-accent text-[15px] font-bold text-gloss"
        >
          Zum Start <ArrowRight className="w-4 h-4" />
        </Link>
        {made?.experienceId && (
          <Link
            to={`/experience/${made.experienceId}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[14px] font-bold text-foreground"
          >
            Szenario ansehen
          </Link>
        )}
        <button onClick={restart} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[14px] font-bold text-muted-foreground">
          <RotateCcw className="w-4 h-4" /> Noch etwas
        </button>
      </div>
    </div>
  );
}