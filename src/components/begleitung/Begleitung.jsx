import React, { useEffect, useMemo, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Heart, Wand2, Volume2, Lightbulb, MessageSquarePlus, Flame, X, Send } from "lucide-react";
import { PERSONAS, SITUATIONS, personaByKey, situationByKey, arousalLabel, buildSystemPrompt, BEGleitUNG_SCHEMA, PROMPTS } from "@/lib/begleitung";

// Begleitung: situativ wählbare KI-Begleiterin. Sie chattet mit, wird mit der
// Stimmung erregter, gibt Tipps, beschreibt Gefühle und erzeugt daraus Bild
// und Stimme. Persona und Situation sind oben einstellbar — je nach Moment.

export default function Begleitung({ onClose }) {
  const { toast } = useToast();
  const [personaKey, setPersonaKey] = useState("artanis");
  const [situationKey, setSituationKey] = useState("frei");
  const [arousal, setArousal] = useState(10);
  const [messages, setMessages] = useState([]); // {role, text, feeling}
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [lastImage, setLastImage] = useState("");
  const [imgBusy, setImgBusy] = useState(false);
  const [voiceBusy, setVoiceBusy] = useState(false);
  const [imagePrompt, setImagePrompt] = useState("");
  const scrollRef = useRef(null);
  const audioRef = useRef(null);

  const persona = useMemo(() => personaByKey(personaKey), [personaKey]);
  const situation = useMemo(() => situationByKey(situationKey), [situationKey]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, busy]);

  // Beim ersten Öffnen grüßt sie einmal in ihrer Art.
  useEffect(() => {
    send(PROMPTS.greet, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const send = async (text, hidden = false) => {
    const clean = (text || "").trim();
    if (!clean || busy) return;
    setBusy(true);
    if (!hidden) setMessages((m) => [...m, { role: "user", text: clean }]);
    try {
      const verlauf = messages.slice(-12).map((m) => `${m.role === "user" ? "Gast" : persona.label}: ${m.text}`).join("\n") || "(noch keiner)";
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: `${buildSystemPrompt(persona, situation, arousal)}\n\nVerlauf:\n${verlauf}\n\nGast jetzt: ${clean}`,
        response_json_schema: BEGleitUNG_SCHEMA,
      });
      const reply = res?.reply || "…";
      const feeling = res?.feeling || "";
      const img = res?.image_prompt || "";
      const next = typeof res?.arousal === "number" ? Math.max(0, Math.min(100, Math.round(res.arousal))) : arousal;
      setMessages((m) => [...m, { role: "assistant", text: reply, feeling }]);
      setArousal(next);
      setImagePrompt(img);
    } catch (e) {
      toast({ variant: "destructive", title: "Antwort fehlgeschlagen", description: e?.message });
    } finally {
      setBusy(false);
    }
  };

  const makeImage = async () => {
    if (!imagePrompt || imgBusy) return;
    setImgBusy(true);
    try {
      const res = await base44.integrations.Core.GenerateImage({ prompt: imagePrompt });
      if (res?.url) setLastImage(res.url);
      else throw new Error("Kein Bild erhalten");
    } catch (e) {
      toast({ variant: "destructive", title: "Bild fehlgeschlagen", description: e?.message });
    } finally {
      setImgBusy(false);
    }
  };

  const speak = async () => {
    const last = [...messages].reverse().find((m) => m.role === "assistant");
    if (!last || voiceBusy) return;
    setVoiceBusy(true);
    try {
      const res = await base44.integrations.Core.GenerateSpeech({ text: last.text, voice: persona.voice, language_code: "de" });
      if (audioRef.current && res?.url) {
        audioRef.current.src = res.url;
        audioRef.current.play().catch(() => {});
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Stimme fehlgeschlagen", description: e?.message });
    } finally {
      setVoiceBusy(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[80] flex h-[min(640px,82vh)] w-[min(380px,92vw)] flex-col overflow-hidden rounded-3xl border border-border bg-card piano shadow-2xl">
      {/* Kopf — Persona & Situation einstellbar */}
      <div className="glass-milky flex items-center justify-between gap-2 border-b border-border px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-full bg-primary/20 text-primary"><Heart className="h-4 w-4" /></div>
          <div className="leading-tight">
            <p className="font-heading text-sm text-foreground">Begleitung</p>
            <p className="text-[10px] text-muted-foreground">{persona.label} · {situation.label}</p>
          </div>
        </div>
        <button onClick={onClose} className="rounded-full p-1.5 text-muted-foreground hover:bg-elevated hover:text-foreground"><X className="h-4 w-4" /></button>
      </div>

      {/* Wähler: Persona & Situation */}
      <div className="space-y-1.5 border-b border-border bg-background/40 px-3 py-2">
        <div className="flex gap-1">
          {PERSONAS.map((p) => (
            <button key={p.key} onClick={() => setPersonaKey(p.key)}
              className={"flex-1 rounded-full px-2 py-1 text-[11px] font-semibold transition " + (p.key === personaKey ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground")}>
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1">
          {SITUATIONS.map((s) => (
            <button key={s.key} onClick={() => setSituationKey(s.key)}
              className={"rounded-full px-2.5 py-1 text-[10px] transition " + (s.key === situationKey ? "bg-secondary text-secondary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground")}>
              {s.label}
            </button>
          ))}
        </div>
        {/* Stimmungs-Anzeige */}
        <div className="flex items-center gap-2 pt-0.5">
          <Flame className="h-3.5 w-3.5 text-primary" />
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-elevated">
            <div className="h-full bg-gradient-to-r from-primary to-secondary transition-all" style={{ width: `${arousal}%` }} />
          </div>
          <span className="text-[10px] font-semibold text-muted-foreground">{arousalLabel(arousal)}</span>
        </div>
      </div>

      {/* Chat-Verlauf */}
      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {messages.length === 0 && !busy && (
          <p className="mt-6 text-center text-xs text-muted-foreground">Sie meldet sich gleich …</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={"flex " + (m.role === "user" ? "justify-end" : "justify-start")}>
            <div className={"max-w-[82%] rounded-2xl px-3 py-2 text-sm " + (m.role === "user" ? "bg-primary text-primary-foreground" : "bg-elevated text-foreground")}>
              {m.role === "assistant" && <p className="mb-0.5 text-[10px] font-bold text-primary">{persona.label}</p>}
              <p className="whitespace-pre-wrap leading-snug">{m.text}</p>
              {m.feeling && <p className="mt-1 border-t border-border/60 pt-1 text-[10px] italic text-muted-foreground">fühlt: {m.feeling}</p>}
            </div>
          </div>
        ))}
        {busy && (
          <div className="flex justify-start">
            <div className="flex items-center gap-1.5 rounded-2xl bg-elevated px-3 py-2 text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> denkt nach …
            </div>
          </div>
        )}
        {lastImage && (
          <div className="overflow-hidden rounded-2xl border border-border">
            <img src={lastImage} alt="aus Gefühl erzeugt" className="w-full" />
            <p className="bg-background/60 px-2 py-1 text-[10px] text-muted-foreground">aus ihrem Gefühl erzeugt</p>
          </div>
        )}
      </div>

      {/* Aktionsleiste */}
      <div className="flex flex-wrap gap-1.5 border-t border-border px-3 py-2">
        <button onClick={() => send(PROMPTS.tip, true)} disabled={busy} title="Sie gibt dir einen Tipp"
          className="inline-flex items-center gap-1 rounded-full bg-elevated px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-50">
          <Lightbulb className="h-3 w-3" /> Tipp
        </button>
        <button onClick={() => send(PROMPTS.chime, true)} disabled={busy} title="Sie mischt sich ungefragt ein"
          className="inline-flex items-center gap-1 rounded-full bg-elevated px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-50">
          <MessageSquarePlus className="h-3 w-3" /> Senf
        </button>
        <button onClick={makeImage} disabled={imgBusy || !imagePrompt} title="Bild aus ihrem Gefühl erzeugen"
          className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[11px] font-semibold text-primary-foreground disabled:opacity-50">
          {imgBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />} Bild
        </button>
        <button onClick={speak} disabled={voiceBusy} title="Letzte Zeile vorlesen"
          className="inline-flex items-center gap-1 rounded-full bg-elevated px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-50">
          {voiceBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Volume2 className="h-3 w-3" />} Stimme
        </button>
      </div>

      {/* Eingabe */}
      <form onSubmit={(e) => { e.preventDefault(); send(input); setInput(""); }} className="flex items-center gap-2 border-t border-border px-3 py-2.5">
        <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Schreib ihr …"
          className="flex-1 rounded-full bg-elevated px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground" />
        <button type="submit" disabled={busy || !input.trim()} className="glass-btn glass-btn-accent grid h-9 w-9 place-items-center rounded-full disabled:opacity-50">
          <Send className="h-4 w-4" />
        </button>
      </form>
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}