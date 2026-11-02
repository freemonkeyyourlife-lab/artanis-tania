import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { Loader2, Save, Sparkles, Volume2, X, Flame, Maximize2, Play } from "lucide-react";

// Kapitel-Editor: zwei Regler (sexier / länger), KI schreibt den Text neu,
// speichert ihn auf dem Kapitel und kann daraus ein Hörbuch erzeugen.

export default function StageEditor({ stage, onClose, onSaved }) {
  const [text, setText] = useState(stage.overlayText || "");
  const [sexier, setSexier] = useState(5);
  const [longer, setLonger] = useState(5);
  const [busy, setBusy] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [generatingBook, setGeneratingBook] = useState(false);

  const rewrite = async () => {
    setBusy("rewrite");
    try {
      const prompt = `Du bist ein erotischer Story-Autor für ein Hörbuch. Schreibe den folgenden Kapitel-Text neu.

Regeln:
- Sexiness-Level: ${sexier}/10 (0 = dezent und sinnlich, 5 = verspielt erotisch, 10 = sehr explizit und direkt)
- Länge-Level: ${longer}/10 (0 = deutlich kürzer und knackiger, 5 = gleich lang, 10 = viel länger und ausführlicher mit mehr Details und Atmosphäre)
- Behalte die Handlung und die Charaktere bei.
- Schreibe in der Ich-Perspektive, wenn der Originaltext es tut, sonst in der dritten Person.
- Schreibe flüssig und bildhaft, geeignet zum Vorlesen.

Originaltext:
${text || "(noch kein Text vorhanden — schreibe einen neuen Kapitel-Text für: " + (stage.title || "ein neues Kapitel") + ")"}

Gib nur den neuen Text zurück, ohne Erklärungen.`;
      const res = await base44.integrations.Core.InvokeLLM({ prompt, model: "claude-sonnet-5" });
      setText(typeof res === "string" ? res : res?.text || res?.response || String(res));
    } finally {
      setBusy(null);
    }
  };

  const save = async () => {
    setBusy("save");
    try {
      const updated = await base44.entities.ExperienceStage.update(stage.id, { overlayText: text });
      onSaved({ ...stage, overlayText: text });
    } finally {
      setBusy(null);
    }
  };

  const makeAudio = async (fullBook = false) => {
    setBusy("audio");
    setGeneratingBook(fullBook);
    try {
      if (fullBook) {
        // Hörbuch für alle Kapitel: lade alle Stages der gleichen Experience
        const all = await base44.entities.ExperienceStage.filter({ experienceId: stage.experienceId }, { sort: "order", limit: 200 });
        const items = all.items || [];
        const urls = [];
        for (const s of items) {
          const t = s.overlayText || s.title || "";
          if (!t) continue;
          const res = await base44.integrations.Core.GenerateSpeech({ text: t.slice(0, 5000), voice: "honey" });
          urls.push({ title: s.title || `Kapitel ${s.order + 1}`, url: res.url });
        }
        setAudioUrl({ full: true, parts: urls });
      } else {
        const res = await base44.integrations.Core.GenerateSpeech({ text: (text || stage.title || "").slice(0, 5000), voice: "honey" });
        setAudioUrl({ full: false, url: res.url });
      }
    } finally {
      setBusy(null);
      setGeneratingBook(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto glass-strong rounded-3xl border-2 border-primary/40 p-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            <p className="text-[15px] font-bold text-foreground">Kapitel bearbeiten</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full glass-btn flex items-center justify-center text-muted-foreground hover:text-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-[13px] font-bold text-primary">{stage.title || `Kapitel ${stage.order + 1}`}</p>

        {/* Regler */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-2xl border border-border bg-elevated p-3">
            <label className="flex items-center gap-1.5 text-[12px] font-bold text-foreground mb-2">
              <Flame className="w-4 h-4 text-primary" /> Sexier: <span className="text-primary">{sexier}/10</span>
            </label>
            <input type="range" min={0} max={10} value={sexier} onChange={(e) => setSexier(+e.target.value)} className="w-full accent-primary" />
            <p className="text-[10px] text-muted-foreground mt-1">{sexier <= 3 ? "dezent" : sexier <= 6 ? "verspielt" : "explizit"}</p>
          </div>
          <div className="rounded-2xl border border-border bg-elevated p-3">
            <label className="flex items-center gap-1.5 text-[12px] font-bold text-foreground mb-2">
              <Maximize2 className="w-4 h-4 text-primary" /> Länger: <span className="text-primary">{longer}/10</span>
            </label>
            <input type="range" min={0} max={10} value={longer} onChange={(e) => setLonger(+e.target.value)} className="w-full accent-primary" />
            <p className="text-[10px] text-muted-foreground mt-1">{longer <= 3 ? "kürzer" : longer <= 6 ? "gleich" : "viel länger"}</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={rewrite}
            disabled={busy === "rewrite"}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-btn glass-btn-accent text-[13px] font-bold text-gloss disabled:opacity-50"
          >
            {busy === "rewrite" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Neu schreiben
          </button>
          <button
            onClick={save}
            disabled={busy === "save" || !text.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-btn text-[13px] font-bold text-foreground disabled:opacity-50"
          >
            {busy === "save" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Speichern
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder="Kapitel-Text …"
          className="w-full px-3 py-2 rounded-xl bg-background border border-border text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
        />

        {/* Hörbuch */}
        <div className="flex flex-col gap-2 rounded-2xl border border-border bg-elevated p-3">
          <p className="text-[12px] font-bold text-foreground flex items-center gap-1.5">
            <Volume2 className="w-4 h-4 text-primary" /> Als Hörbuch
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => makeAudio(false)}
              disabled={busy === "audio" || !text.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-btn text-[12px] font-bold text-foreground disabled:opacity-50"
            >
              {busy === "audio" && !generatingBook ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
              Dieses Kapitel
            </button>
            <button
              onClick={() => makeAudio(true)}
              disabled={busy === "audio"}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-btn glass-btn-accent text-[12px] font-bold text-gloss disabled:opacity-50"
            >
              {busy === "audio" && generatingBook ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Volume2 className="w-3.5 h-3.5" />}
              Ganzes Hörbuch
            </button>
          </div>
          {audioUrl && !audioUrl.full && (
            <audio src={audioUrl.url} controls className="w-full mt-1" />
          )}
          {audioUrl && audioUrl.full && (
            <div className="flex flex-col gap-1.5 mt-1">
              {audioUrl.parts.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-muted-foreground w-20 truncate">{p.title}</span>
                  <audio src={p.url} controls className="flex-1" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}