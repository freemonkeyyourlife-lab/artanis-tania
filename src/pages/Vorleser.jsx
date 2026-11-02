import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Volume2, Download, Wand2 } from "lucide-react";

const VOICES = [
  { id: "river", label: "River — ruhig, neutral" },
  { id: "honey", label: "Honey — warm, weich" },
  { id: "sunny", label: "Sunny — hell, heiter" },
  { id: "storm", label: "Storm — formell, bestimmt" },
  { id: "spark", label: "Spark — energisch, schnell" },
];

const MOODS = [
  { id: "SANFT", label: "Sanft", voice: "honey" },
  { id: "ANZUEGLICH", label: "Anzieglich", voice: "honey" },
  { id: "SINNLICH", label: "Sinnlich", voice: "storm" },
  { id: "EXPLIZIT", label: "Explizit", voice: "storm" },
  { id: "HART", label: "Hart", voice: "spark" },
  { id: "FREUNDLICH", label: "Freundlich", voice: "sunny" },
];

const inputCls =
  "w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground";

// Ein Vorleser mit Stimmung: Text rein, Stimme und Stimmung wählen, optional
// schreibt das Modell den Text auf die Stimmung um, dann wird er vorgelesen.
export default function Vorleser() {
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("honey");
  const [mood, setMood] = useState("SANFT");
  const [useModel, setUseModel] = useState(true);
  const [adapted, setAdapted] = useState("");
  const [audio, setAudio] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  const pickMood = (m) => {
    setMood(m.id);
    setVoice(m.voice);
  };

  const speak = async () => {
    const src = (adapted || text).trim();
    if (!src) return;
    setBusy(true);
    setNotice("");
    try {
      let spoken = src;
      if (useModel) {
        const r = await base44.integrations.Core.InvokeLLM({
          prompt:
            `Überarbeite den folgenden Text so, dass er die Stimmung "${mood}" trägt. ` +
            "Behalte Inhalt, Aussage und Sprache genau bei — passe nur Tonfall, Wortwahl und Rhythmus an. " +
            "Keine Überschriften, keine Erklärung, nur der neue Text.\n\n" +
            src,
        });
        spoken = typeof r === "string" ? r : String(r || src);
        setAdapted(spoken);
      }
      const res = await base44.integrations.Core.GenerateSpeech({
        text: spoken.slice(0, 5000),
        voice,
        language_code: "de",
      });
      if (res?.url) setAudio(res.url);
      else setNotice("Die Stimme kam nicht zurück — bitte nochmal.");
    } catch (e) {
      setNotice("Fehlgeschlagen — bitte nochmal.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-4xl text-foreground text-gloss">Stimmungs-Vorleser</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Text rein, Stimme und Stimmung wählen — das Modell kann den Text vorher auf die Stimmung
        umschreiben, dann wird er vorgelesen.
      </p>

      <section className="glass mt-6 rounded-2xl border border-border p-4">
        <label className="mb-1.5 block text-xs text-muted-foreground">Text</label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="Füge hier den Text ein, der vorgelesen werden soll …"
          className={`${inputCls} resize-none leading-relaxed`}
        />
        {adapted && adapted !== text && (
          <div className="mt-3">
            <p className="text-xs text-muted-foreground">Vom Modell auf die Stimmung umgeschrieben:</p>
            <p className="mt-1 whitespace-pre-line rounded-xl bg-background p-3 text-sm text-foreground">
              {adapted}
            </p>
          </div>
        )}
      </section>

      <section className="glass mt-4 rounded-2xl border border-border p-4">
        <div className="mb-2 font-heading text-foreground">Stimmung</div>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button
              key={m.id}
              onClick={() => pickMood(m)}
              className={`glass-btn rounded-full px-4 py-2 text-sm font-bold ${
                mood === m.id ? "glass-btn-accent" : "text-foreground"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs text-muted-foreground">Stimme</label>
            <select value={voice} onChange={(e) => setVoice(e.target.value)} className={inputCls}>
              {VOICES.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-muted-foreground">Modell</label>
            <button
              onClick={() => setUseModel((v) => !v)}
              className={`glass-btn w-full rounded-xl px-4 py-2.5 text-sm font-bold ${
                useModel ? "glass-btn-accent" : "text-muted-foreground"
              }`}
            >
              {useModel ? "An — Text wird auf Stimmung umgeschrieben" : "Aus — Text wird wie er ist gelesen"}
            </button>
          </div>
        </div>
      </section>

      <button
        onClick={speak}
        disabled={busy || !text.trim()}
        className="glass-btn glass-btn-accent mt-4 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm disabled:opacity-50"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Volume2 className="h-4 w-4" />}
        {busy ? "Spricht …" : "Vorlesen"}
      </button>

      {notice && <p className="mt-3 text-sm font-bold text-primary">{notice}</p>}

      {audio && (
        <section className="glass mt-5 rounded-2xl border border-border p-4">
          <div className="mb-2 flex items-center gap-2 font-heading text-foreground">
            <Volume2 className="h-4 w-4 text-primary" /> Ergebnis
          </div>
          <audio src={audio} controls className="w-full" />
          <a
            href={audio}
            download="vorleser.mp3"
            className="glass-btn mt-3 inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-bold text-foreground"
          >
            <Download className="h-3.5 w-3.5" /> Herunterladen
          </a>
        </section>
      )}

      <p className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
        <Wand2 className="h-3 w-3" /> Stimmen sind die eingebauten Base44-Stimmen — eigene
        Stimmmodelle lassen sich später als eigene Stimmen anbinden.
      </p>
    </div>
  );
}