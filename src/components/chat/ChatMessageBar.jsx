import React, { useState, useRef, useEffect } from "react";
import { Play, Square, Flame, Image as ImageIcon, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";

// Wiederverwendbare Leiste unter jeder Chat-Nachricht: Wärme-Regler, Stimme,
// Modell-Auswahl und drei Aktionen — vorlesen, heißer neu erzeugen, Bild dazu.
// Selbst-contained: Ergebnisse (vorgelesen, neu erzeugter Text, Bild) erscheinen
// inline, ohne die Nachricht selbst zu verändern.

const VOICES = [
  { id: "river", label: "River · ruhig" },
  { id: "honey", label: "Honey · warm" },
  { id: "sunny", label: "Sunny · hell" },
  { id: "storm", label: "Storm · bestimmt" },
  { id: "spark", label: "Spark · energetisch" },
];
const HEAT_WORDS = ["sanfter", "wie gehabt", "heißer", "explizit"];

// Text-Modelle nur einmal für alle Instanzen laden.
let _textModels = null;
let _textModelsP = null;
function useTextModels() {
  const [models, setModels] = useState(_textModels || []);
  useEffect(() => {
    if (!_textModelsP) {
      _textModelsP = base44.entities.TextModel.list("-created_date", 100)
        .then((r) => {
          _textModels = (r || []).filter((m) => m.enabled !== false);
          return _textModels;
        })
        .catch(() => []);
    }
    _textModelsP.then(setModels);
  }, []);
  return models;
}

export default function ChatMessageBar({ text, senderName }) {
  const [heat, setHeat] = useState(1);
  const [voice, setVoice] = useState("honey");
  const textModels = useTextModels();
  const [textModelId, setTextModelId] = useState("");
  const [busy, setBusy] = useState("");
  const [playing, setPlaying] = useState(false);
  const [regen, setRegen] = useState("");
  const [img, setImg] = useState("");
  const audioRef = useRef(null);

  if (!text || !String(text).trim()) return null;

  const stop = () => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
    setPlaying(false);
  };

  const vorlesen = async () => {
    if (busy) return;
    stop();
    setBusy("voice");
    try {
      const r = await base44.integrations.Core.GenerateSpeech({ text, voice });
      const url = r?.url;
      if (!url) return;
      const a = new Audio(url);
      audioRef.current = a;
      a.onended = () => setPlaying(false);
      setPlaying(true);
      a.play().catch(() => setPlaying(false));
    } catch (e) {
      console.error(e);
    } finally {
      setBusy("");
    }
  };

  const regenHotter = async () => {
    if (busy) return;
    setBusy("regen");
    try {
      const prompt =
        `Erzeuge diese Antwort neu — ${HEAT_WORDS[heat] || "heißer"}, körpernäher, direkter, intensiver. ` +
        `Behalte Kontext und Bedeutung. Nur die neue Antwort, auf Deutsch:\n\n${text}`;
      const res = await base44.integrations.Core.InvokeLLM({ prompt, model: textModelId || undefined });
      const out = typeof res === "string" ? res : res?.response || res?.text || res?.output || "";
      setRegen(String(out).trim());
    } catch (e) {
      console.error(e);
    } finally {
      setBusy("");
    }
  };

  const makeImage = async () => {
    if (busy) return;
    setBusy("bild");
    try {
      const prompt =
        `Kinorealistisches Bild zur Szene. Intensität ${heat}/3 — ${HEAT_WORDS[heat] || ""}. ` +
        `Szene: ${String(text).slice(0, 400)}. Erwachsene, einvernehmlich, stimmungsvolles Licht. Keine realen Personen.`;
      const r = await base44.integrations.Core.GenerateImage({ prompt });
      if (r?.url) setImg(r.url);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="mt-2 pt-2 border-t border-white/15">
      <div className="flex items-center gap-1.5 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Flame className="w-3.5 h-3.5 text-primary" />
          <input
            type="range"
            min={0}
            max={3}
            step={1}
            value={heat}
            onChange={(e) => setHeat(Number(e.target.value))}
            className="w-16 accent-primary"
            title="Wie heiß"
          />
          <span className="text-[10px] font-bold text-muted-foreground w-14">{HEAT_WORDS[heat]}</span>
        </div>

        <select
          value={voice}
          onChange={(e) => setVoice(e.target.value)}
          className="px-2 py-1 rounded-full bg-elevated border border-border text-[11px] font-bold text-foreground"
          title="Stimme zum Vorlesen"
        >
          {VOICES.map((v) => (
            <option key={v.id} value={v.id}>{v.label}</option>
          ))}
        </select>

        <select
          value={textModelId}
          onChange={(e) => setTextModelId(e.target.value)}
          className="px-2 py-1 rounded-full bg-elevated border border-border text-[11px] font-bold text-foreground max-w-[9rem] truncate"
          title="Text-Modell zum Neu-Erzeugen"
        >
          <option value="">Modell · Standard</option>
          {textModels.map((m) => (
            <option key={m.id} value={m.modelId || m.id}>{m.name}</option>
          ))}
        </select>

        <button
          onClick={playing ? stop : vorlesen}
          className={cn(
            "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors",
            playing ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground"
          )}
        >
          {busy === "voice" ? <Loader2 className="w-3 h-3 animate-spin" /> : playing ? <Square className="w-3 h-3" /> : <Play className="w-3 h-3" />}
          {playing ? "Stopp" : "Vorlesen"}
        </button>

        <button
          onClick={regenHotter}
          disabled={!!busy}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-elevated text-[11px] font-bold text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          {busy === "regen" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Flame className="w-3 h-3" />}
          Heißer neu
        </button>

        <button
          onClick={makeImage}
          disabled={!!busy}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-elevated text-[11px] font-bold text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          {busy === "bild" ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
          Bild
        </button>
      </div>

      {regen && (
        <div className="mt-2 rounded-lg bg-elevated/70 p-2 text-[12px] text-foreground whitespace-pre-wrap">
          <p className="text-[10px] font-bold uppercase text-primary mb-1">Heißer neu · {HEAT_WORDS[heat]}</p>
          {regen}
          <button
            onClick={() => navigator.clipboard?.writeText(regen)}
            className="mt-1 text-[10px] text-muted-foreground hover:text-foreground"
          >
            Kopieren
          </button>
        </div>
      )}

      {img && (
        <div className="mt-2">
          <img src={img} alt="" className="w-full max-w-sm rounded-xl" />
        </div>
      )}
    </div>
  );
}