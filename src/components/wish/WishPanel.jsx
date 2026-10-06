import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { X, Sparkles, Loader2, Eye, Users, Crown, Upload, Coins, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import VoiceInput from "@/components/VoiceInput";
import InfoDot from "@/components/InfoDot";

const WISH_KEY = "artanis_wish_text";
const PICK_KEY = "artanis_wish_pick";

const IDEAS = [
  "Ich will nur zuschauen und mich dabei aufregen",
  "Sie soll mich verführen, und ich mache mit",
  "Ich will die Szene komplett übernehmen und bestimmen",
  "Ich habe eigenes Material und will es verarbeiten lassen",
];

// Wie viel jemand selbst eingreift — daraus ergibt sich, wohin der Knopf führt.
const MODES = {
  ZUSCHAUEN: { label: "Nur zuschauen", icon: Eye, to: "/live", cta: "Reinschauen" },
  MITMACHEN: { label: "Mitmachen", icon: Users, to: "/messages", cta: "Nachspielen" },
  UEBERNEHMEN: { label: "Übernehmen", icon: Crown, to: "/interactive", cta: "Übernehmen" },
  EIGENER_CONTENT: { label: "Eigener Content", icon: Upload, to: "/studio", cta: "Content hochladen" },
};

const SCHEMA = {
  type: "object",
  properties: {
    verstanden: { type: "string" },
    angebote: {
      type: "array",
      items: {
        type: "object",
        properties: {
          titel: { type: "string" },
          was_passiert: { type: "string" },
          mitmachen: { type: "string", enum: ["ZUSCHAUEN", "MITMACHEN", "UEBERNEHMEN", "EIGENER_CONTENT"] },
          preis_coins: { type: "number" },
          dauer: { type: "string" },
        },
        required: ["titel", "was_passiert", "mitmachen", "preis_coins"],
      },
    },
  },
  required: ["verstanden", "angebote"],
};

const buildPrompt = (wish) => `Du bist der Angebots-Assistent von "Artanis × Tania", einer Plattform für Story-Games und Rollenspiel für Erwachsene.

Jemand sagt frei heraus, was er will. Übersetze diesen Wunsch in 3 bis 4 konkrete Angebote, die genau dazu passen.

Der Wunsch:
"${wish}"

Regeln:
- Jedes Angebot sagt klar, WAS passiert und WIE viel der Nutzer selbst eingreift.
- "mitmachen" ist genau einer dieser vier Werte:
  ZUSCHAUEN = er will nur beobachten und nichts tun,
  MITMACHEN = er will mitreden und mitspielen,
  UEBERNEHMEN = er will die Szene steuern und bestimmen,
  EIGENER_CONTENT = es geht um eigenes Material, das er hochlädt oder verarbeiten lässt.
- preis_coins: realistischer Preis in Coins, ganze Zahl zwischen 0 und 500 (0 = gratis).
- dauer: kurz, z. B. "10 Minuten", "eine Nacht", "offen".
- Sprache: Deutsch, direkt, einfache Worte, kein Fachjargon.
- Schreibe sachlich und beschreibend. Es geht um das Angebot, nicht um den Inhalt — schreibe keine expliziten Szenen aus.
- "verstanden" ist ein Satz, der zeigt, dass du ihn verstanden hast.`;

export default function WishPanel({ onClose }) {
  const navigate = useNavigate();
  const [wish, setWish] = useState(() => {
    try { return localStorage.getItem(WISH_KEY) || ""; } catch (e) { return ""; }
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const run = async (text) => {
    const w = String(text ?? wish).trim();
    if (!w) return;
    setWish(w);
    try { localStorage.setItem(WISH_KEY, w); } catch (e) { /* egal */ }
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await base44.integrations.Core.InvokeLLM({ prompt: buildPrompt(w), response_json_schema: SCHEMA });
      setResult(res);
    } catch (e) {
      console.error(e);
      setError("Das hat gerade nicht geklappt. Versuch es nochmal.");
    } finally {
      setLoading(false);
    }
  };

  const go = (offer) => {
    const mode = MODES[offer.mitmachen] || MODES.MITMACHEN;
    try { localStorage.setItem(PICK_KEY, `${offer.titel} — ${offer.was_passiert}`); } catch (e) { /* egal */ }
    onClose();
    navigate(mode.to);
  };

  return (
    <div className="fixed inset-0 z-[95] flex items-start justify-center overflow-y-auto p-4 py-10" onClick={onClose}>
      <div className="absolute inset-0 bg-background/85 backdrop-blur-sm" />
      <div
        className="relative glass-strong rounded-[2.5rem] border-2 border-border p-6 sm:p-8 max-w-3xl w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3 mb-6">
          <span className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-7 h-7 text-primary" />
          </span>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-3xl text-foreground flex items-center gap-2">
              Sag was du willst
              <InfoDot topic="wish" />
            </h2>
            <p className="text-[15px] font-semibold text-muted-foreground mt-1">
              Rede frei heraus oder tippe es. Ich übersetze es dir in konkrete Angebote.
            </p>
          </div>
          <button onClick={onClose} className="w-11 h-11 rounded-full glass-btn flex items-center justify-center text-muted-foreground flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="rounded-[2rem] border-2 border-border bg-card p-4">
          <textarea
            value={wish}
            onChange={(e) => setWish(e.target.value)}
            rows={4}
            placeholder="Zum Beispiel: Ich will, dass sie mich verführt und ich dann übernehme …"
            className="w-full bg-transparent text-[16px] font-semibold text-foreground placeholder:text-muted-foreground resize-none focus:outline-none"
          />
          <div className="flex flex-wrap items-center gap-3 mt-3">
            <button
              onClick={() => run()}
              disabled={loading || !wish.trim()}
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full glass-btn glass-btn-accent text-[15px] font-bold text-gloss disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? "Denke nach …" : "Zeig mir, was dazu passt"}
            </button>
            <VoiceInput onResult={(text) => run(text)} disabled={loading} />
            {result && (
              <button
                onClick={() => { setResult(null); setWish(""); }}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-full glass-btn text-[14px] font-bold text-muted-foreground"
              >
                <RefreshCw className="w-4 h-4" /> Neuer Wunsch
              </button>
            )}
          </div>
        </div>

        {!result && !loading && (
          <div className="flex flex-wrap gap-2 mt-5">
            {IDEAS.map((idea) => (
              <button
                key={idea}
                onClick={() => run(idea)}
                className="px-4 py-2.5 rounded-full bg-elevated border-2 border-border text-[13px] font-semibold text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
              >
                {idea}
              </button>
            ))}
          </div>
        )}

        {error && <p className="mt-5 text-[15px] font-bold text-destructive">{error}</p>}

        {result && (
          <div className="mt-6">
            {result.verstanden && (
              <p className="text-[15px] font-bold text-primary mb-4">Verstanden: {result.verstanden}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(result.angebote || []).map((offer, i) => {
                const mode = MODES[offer.mitmachen] || MODES.MITMACHEN;
                const Icon = mode.icon;
                return (
                  <div key={i} className="rounded-[2rem] border-2 border-border bg-card p-5 flex flex-col">
                    <span className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mb-3">
                      <Icon className="w-6 h-6 text-primary" />
                    </span>
                    <p className="font-display text-xl text-foreground">{offer.titel}</p>
                    <p className="text-[14px] font-semibold text-muted-foreground mt-2 flex-1 leading-relaxed">{offer.was_passiert}</p>
                    <div className="flex flex-wrap items-center gap-2 mt-4">
                      <span className="px-3 py-1 rounded-full bg-primary/15 text-primary text-[12px] font-bold">{mode.label}</span>
                      {offer.dauer && <span className="px-3 py-1 rounded-full bg-elevated border-2 border-border text-[12px] font-semibold text-muted-foreground">{offer.dauer}</span>}
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-elevated border-2 border-border text-[12px] font-bold text-foreground">
                        <Coins className="w-3.5 h-3.5 text-primary" />
                        {offer.preis_coins > 0 ? `${offer.preis_coins} Coins` : "gratis"}
                      </span>
                    </div>
                    <button
                      onClick={() => go(offer)}
                      className="mt-4 w-full px-6 py-3 rounded-full glass-btn glass-btn-accent text-[15px] font-bold text-gloss"
                    >
                      {mode.cta}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}