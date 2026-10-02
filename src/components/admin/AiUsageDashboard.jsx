import React, { useEffect, useMemo, useState } from "react";
import moment from "moment";
import { base44 } from "@/api/base44Client";
import { Activity, Coins, Cpu, RefreshCw, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { getMoodModel, setMoodModel } from "@/lib/aiGateway";
import UsageCharts from "@/components/admin/UsageCharts";

const RANGES = [
  { id: "today", label: "Heute" },
  { id: "7", label: "7 Tage" },
  { id: "30", label: "30 Tage" },
  { id: "all", label: "Alles" },
];

const KIND_LABEL = { TEXT: "Text", BILD: "Bild", STIMMUNG: "Stimmung" };

const money = (v) => `${(Number(v) || 0).toFixed(4)} $`;
const count = (v) => (Number(v) || 0).toLocaleString("de-DE");

// Welche Modelle laufen, wie oft — und was kostet das.
export default function AiUsageDashboard() {
  const [range, setRange] = useState("7");
  const [rows, setRows] = useState([]);
  const [timeline, setTimeline] = useState([]);
  const [favOnly, setFavOnly] = useState(false);
  const [recent, setRecent] = useState([]);
  const [models, setModels] = useState([]);
  const [moodModel, setMood] = useState(() => getMoodModel());
  const [loading, setLoading] = useState(true);

  const buildQuery = () => {
    if (range === "today") return { created_date: { $gte: moment().startOf("day").toISOString() } };
    if (range === "all") return {};
    return { created_date: { $gte: moment().subtract(Number(range), "days").startOf("day").toISOString() } };
  };

  const load = async () => {
    setLoading(true);
    try {
      const query = buildQuery();
      const [agg, bucket, page] = await Promise.all([
        base44.entities.AiUsage.aggregate({
          query,
          groupBy: "modelId",
          sum: ["costUsd", "promptTokens", "completionTokens"],
          sort: "-count",
          limit: 100,
        }),
        base44.entities.AiUsage.aggregate({
          query,
          dateBucket: { field: "created_date", unit: "day" },
          sum: ["costUsd"],
          limit: 400,
        }),
        base44.entities.AiUsage.filter(query, { sort: "-created_date", limit: 20 }),
      ]);
      setRows(agg.rows || []);
      setTimeline(bucket.rows || []);
      setRecent(page.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [range]);

  useEffect(() => {
    base44.entities.TextModel.filter(
      { enabled: true, note: { $regex: "^OpenRouter" } },
      { sort: "name", limit: 500 }
    )
      .then((page) => setModels(
        (page.items || []).slice().sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0))
      ))
      .catch(() => setModels([]));
  }, []);

  const totals = useMemo(
    () =>
      rows.reduce(
        (a, r) => ({
          calls: a.calls + (r.count || 0),
          cost: a.cost + (r.sum_costUsd || 0),
          tokens: a.tokens + (r.sum_promptTokens || 0) + (r.sum_completionTokens || 0),
        }),
        { calls: 0, cost: 0, tokens: 0 }
      ),
    [rows]
  );

  // Favoriten stehen oben — und lassen sich auf Wunsch allein anzeigen.
  const moodOptions = favOnly ? models.filter((m) => m.favorite) : models;

  const chooseMood = (id) => {
    setMoodModel(id);
    setMood(id);
  };

  return (
    <div className="p-5 rounded-2xl border border-border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl text-foreground">KI-Nutzung & Kosten</h2>
          <p className="text-xs text-muted-foreground">
            Jede OpenRouter-Abfrage mit Modell, Tokens und Preis — damit du siehst, wohin das Guthaben fließt.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-btn text-xs font-bold text-foreground"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} /> Aktualisieren
        </button>
      </div>

      <div className="flex flex-wrap gap-2 my-5">
        {RANGES.map((r) => (
          <button
            key={r.id}
            onClick={() => setRange(r.id)}
            className={cn(
              "px-4 py-2 rounded-full text-xs font-semibold transition-colors",
              range === r.id ? "bg-primary text-primary-foreground" : "bg-elevated border border-border text-muted-foreground"
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="rounded-2xl border border-border bg-elevated p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1 inline-flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" /> Abfragen
          </p>
          <p className="font-display text-2xl text-foreground">{count(totals.calls)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-elevated p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1 inline-flex items-center gap-1.5">
            <Coins className="w-3.5 h-3.5" /> Kosten
          </p>
          <p className="font-display text-2xl text-primary">{money(totals.cost)}</p>
        </div>
        <div className="rounded-2xl border border-border bg-elevated p-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1 inline-flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5" /> Tokens
          </p>
          <p className="font-display text-2xl text-foreground">{count(totals.tokens)}</p>
        </div>
      </div>

      <UsageCharts rows={rows} timeline={timeline} loading={loading} />

      <div className="rounded-2xl border border-border bg-elevated p-4 mt-6">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 inline-flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5" /> Modell für die Stimmungserkennung
        </p>
        <div className="flex flex-wrap items-center gap-2 mb-3">
          <button
            onClick={() => setFavOnly((v) => !v)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors",
              favOnly ? "bg-amber-500/20 text-amber-400" : "bg-background border border-border text-muted-foreground"
            )}
          >
            <Star className={cn("w-3 h-3", favOnly && "fill-current")} /> Nur Favoriten
          </button>
          <span className="text-[11px] text-muted-foreground">Favoriten stehen oben.</span>
        </div>
        <select
          value={moodModel}
          onChange={(e) => chooseMood(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground"
        >
          <option value="">Standard-KI (ohne OpenRouter)</option>
          {moodOptions.length === 0 && <option value="" disabled>Keine Favoriten markiert</option>}
          {moodOptions.map((m) => (
            <option key={m.id} value={m.modelId}>{m.name}</option>
          ))}
        </select>
        <p className="text-[11px] text-muted-foreground mt-2">
          Liest die Stimmung ab jetzt mit diesem Modell. Ohne Auswahl bleibt es bei der Standard-KI.
        </p>
      </div>

      {recent.length > 0 && (
        <div className="mt-6">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
            Letzte Abfragen
          </p>
          <div className="space-y-2">
            {recent.map((u) => (
              <div key={u.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-elevated px-3 py-2">
                <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold uppercase tracking-wider">
                  {KIND_LABEL[u.kind] || u.kind}
                </span>
                <span className="text-xs font-semibold text-foreground truncate flex-1 min-w-0">{u.modelId}</span>
                <span className="text-[11px] text-muted-foreground">{money(u.costUsd)}</span>
                <span className="text-[11px] text-muted-foreground">
                  {moment(u.created_date).format("DD.MM. HH:mm")}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}