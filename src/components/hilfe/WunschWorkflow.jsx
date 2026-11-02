import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2, Save, Check, RefreshCw, ArrowRight } from "lucide-react";
import { buildWunschPrompt, WUNSCH_SCHEMA, WUNSCH_ROUTES } from "@/lib/hilfeWunsch";

const PRESETS = [
  "Ich will eine neue Figur bauen und ihr eine eigene Stimme geben",
  "Ich will ein Trainingsset für eine Person fertigstellen",
  "Ich will eine eigene Seite bauen und veröffentlichen",
  "Ich will den Chat so einstellen, dass er automatisch vorliest",
];

// Der Wunsch-Workflow: frei formulieren → Schritt-für-Schritt-Plan → speichern.
export default function WunschWorkflow() {
  const [wish, setWish] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const run = async (text) => {
    const w = String(text ?? wish).trim();
    if (!w) return;
    setWish(w);
    setLoading(true);
    setError("");
    setResult(null);
    setSaved(false);
    try {
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: buildWunschPrompt(w),
        response_json_schema: WUNSCH_SCHEMA,
      });
      setResult(res);
    } catch (e) {
      console.error(e);
      setError("Das hat gerade nicht geklappt. Versuch es nochmal.");
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!result) return;
    setSaving(true);
    setError("");
    try {
      await base44.entities.BuildTask.create({
        title: result.titel || wish.slice(0, 60),
        description: result.verstanden || "",
        prompt: wish,
        status: "WARTESCHLANGE",
        kind: "SONSTIGES",
        source: "ROADMAP",
      });
      setSaved(true);
    } catch (e) {
      console.error(e);
      setError("Speichern ging gerade nicht — nur die Besitzerin darf das.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-[2rem] border-2 border-border bg-card p-5">
      <h3 className="font-display text-xl text-foreground mb-1">Dein Wunsch — als Schritt-für-Schritt-Plan</h3>
      <p className="text-[14px] font-semibold text-muted-foreground mb-4">
        Sag frei, was du vorhast. Du bekommst einen Plan, den du speichern kannst.
      </p>

      <textarea
        value={wish}
        onChange={(e) => setWish(e.target.value)}
        rows={3}
        placeholder="Zum Beispiel: Ich will eine neue Figur bauen und ihr eine Stimme geben …"
        className="w-full rounded-2xl bg-background border-2 border-border p-3 text-[15px] font-semibold text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/50"
      />

      <div className="flex flex-wrap items-center gap-2 mt-3">
        <button
          onClick={() => run()}
          disabled={loading || !wish.trim()}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full glass-btn glass-btn-accent text-[14px] font-bold text-gloss disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? "Denke nach …" : "Plan erstellen"}
        </button>
        {result && (
          <button
            onClick={() => { setResult(null); setSaved(false); setWish(""); }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[13px] font-bold text-muted-foreground"
          >
            <RefreshCw className="w-4 h-4" /> Neuer Wunsch
          </button>
        )}
      </div>

      {!result && !loading && (
        <div className="flex flex-wrap gap-2 mt-4">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => run(p)}
              className="px-3 py-2 rounded-full bg-elevated border-2 border-border text-[12px] font-semibold text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {error && <p className="mt-4 text-[14px] font-bold text-destructive">{error}</p>}

      {result && (
        <div className="mt-5">
          {result.verstanden && (
            <p className="text-[15px] font-bold text-primary mb-3">Verstanden: {result.verstanden}</p>
          )}
          <ol className="space-y-2.5">
            {(result.schritte || []).map((s, i) => {
              const route = WUNSCH_ROUTES.find((r) => r.path === s.ort);
              return (
                <li key={i} className="rounded-2xl bg-background border-2 border-border p-3">
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 w-7 h-7 rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center text-[13px]">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground text-[15px]">{s.titel}</p>
                      <p className="text-[13px] font-semibold text-muted-foreground mt-0.5">{s.was}</p>
                      {route && (
                        <Link
                          to={route.path}
                          className="inline-flex items-center gap-1 mt-1.5 text-[13px] font-bold text-primary hover:underline"
                        >
                          {route.label} <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
          <button
            onClick={save}
            disabled={saving || saved}
            className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-full glass-btn text-[14px] font-bold disabled:opacity-50"
          >
            {saved ? <Check className="w-4 h-4 text-emerald-400" /> : saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saved ? "Gespeichert — im Logbuch" : saving ? "Speichere …" : "Plan speichern"}
          </button>
        </div>
      )}
    </div>
  );
}