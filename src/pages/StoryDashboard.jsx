import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { Loader2, BarChart3, TrendingDown, Clock, MessageSquare, Star, Users, ChevronRight, BookOpen } from "lucide-react";
import StageEditor from "@/components/story/StageEditor";
import StageIntensitySliders from "@/components/story/StageIntensitySliders";

// Story-Analytics-Dashboard: welche Kapitel am meisten interagiert werden,
// wo die Nutzer hängen bleiben, und ein Editor der jedes Kapitel sexier oder
// länger macht — der Text wird gespeichert und lässt sich als Hörbuch erzeugen.

export default function StoryDashboard() {
  const [experiences, setExperiences] = useState([]);
  const [overview, setOverview] = useState({});
  const [selected, setSelected] = useState(null);
  const [stages, setStages] = useState([]);
  const [funnel, setFunnel] = useState({});
  const [loading, setLoading] = useState(true);
  const [editStage, setEditStage] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const exp = await base44.entities.Experience.list({ limit: 200, sort: "-created_date" });
        setExperiences(exp.items || exp || []);
        const agg = await base44.entities.UserProgress.aggregate({ query: {}, groupBy: "experienceId" });
        const map = {};
        (agg.rows || []).forEach((r) => { map[r.experienceId] = { count: r.count, points: r.sum_points || 0, time: r.sum_timeSpent || 0, msgs: r.sum_messagesSent || 0 }; });
        setOverview(map);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectExp = async (exp) => {
    setSelected(exp);
    setEditStage(null);
    const stageRes = await base44.entities.ExperienceStage.filter({ experienceId: exp.id }, { sort: "order", limit: 200 });
    const stageList = stageRes.items || [];
    setStages(stageList);
    const fn = await base44.entities.UserProgress.aggregate({ query: { experienceId: exp.id }, groupBy: "currentStageId" });
    const fmap = {};
    (fn.rows || []).forEach((r) => { fmap[r.currentStageId] = r.count; });
    setFunnel(fmap);
  };

  const totalStarted = useMemo(() => Object.values(overview).reduce((s, v) => s + (v.count || 0), 0), [overview]);

  if (loading) return <Shell><div className="flex items-center gap-2 text-muted-foreground py-12"><Loader2 className="w-5 h-5 animate-spin" /> Lade Story-Daten …</div></Shell>;

  return (
    <Shell>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
        <StatCard icon={BookOpen} label="Story-Erlebnisse" value={experiences.length} />
        <StatCard icon={Users} label="Gestartet gesamt" value={totalStarted} />
        <StatCard icon={Star} label="Punkte gesamt" value={Object.values(overview).reduce((s, v) => s + (v.points || 0), 0)} />
        <StatCard icon={Clock} label="Zeit gesamt" value={`${Math.round(Object.values(overview).reduce((s, v) => s + (v.time || 0), 0) / 60)} min`} />
      </div>

      {!selected ? (
        <div className="flex flex-col gap-2">
          <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground px-1">Alle Story-Erlebnisse</p>
          {experiences.length === 0 ? (
            <p className="text-[13px] text-muted-foreground py-6 text-center">Noch keine Story-Erlebnisse angelegt.</p>
          ) : experiences.map((exp) => {
            const o = overview[exp.id] || { count: 0, points: 0, time: 0, msgs: 0 };
            return (
              <button key={exp.id} onClick={() => selectExp(exp)} className="rounded-2xl border border-border bg-elevated p-3 flex items-center gap-3 hover:border-primary/50 transition-colors text-left">
                <div className="flex-1">
                  <p className="text-[14px] font-bold text-foreground">{exp.title}</p>
                  <p className="text-[11px] text-muted-foreground">{exp.experienceType} · {exp.visibility}</p>
                </div>
                <div className="flex items-center gap-3 text-[12px]">
                  <MiniStat icon={Users} value={o.count} />
                  <MiniStat icon={Star} value={o.points} />
                  <MiniStat icon={Clock} value={`${Math.round((o.time || 0) / 60)}m`} />
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <button onClick={() => { setSelected(null); setStages([]); }} className="inline-flex items-center gap-1 text-[12px] font-bold text-muted-foreground hover:text-primary">
            ← Zurück zur Übersicht
          </button>
          <div className="rounded-2xl border-2 border-primary/30 bg-background/40 p-3">
            <p className="text-[16px] font-bold text-foreground">{selected.title}</p>
            <p className="text-[11px] text-muted-foreground">{stages.length} Kapitel · {overview[selected.id]?.count || 0} Nutzer gestartet</p>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground px-1">Kapitel-Funnel — wo hängen die Nutzer</p>
            {stages.length === 0 ? (
              <p className="text-[13px] text-muted-foreground py-4 text-center">Keine Kapitel angelegt.</p>
            ) : stages.map((stage, i) => {
              const reached = funnel[stage.id] || 0;
              const prevReached = i > 0 ? (funnel[stages[i - 1].id] || 0) : reached;
              const dropoff = i > 0 && prevReached > 0 ? Math.round((1 - reached / prevReached) * 100) : 0;
              const maxReached = Math.max(...Object.values(funnel), 1);
              const width = (reached / maxReached) * 100;
              return (
                <div key={stage.id} className="rounded-2xl border border-border bg-elevated p-3">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-6 h-6 rounded-full glass-btn glass-btn-accent text-gloss text-[11px] font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                    <p className="text-[13px] font-bold text-foreground flex-1 truncate">{stage.title || `Kapitel ${i + 1}`}</p>
                    {dropoff > 0 && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-destructive">
                        <TrendingDown className="w-3 h-3" /> -{dropoff}%
                      </span>
                    )}
                    <button onClick={() => setEditStage(stage)} className="inline-flex items-center gap-1 px-3 py-1 rounded-full glass-btn text-[11px] font-bold text-foreground hover:text-primary">
                      Bearbeiten
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-6 rounded-lg bg-background overflow-hidden">
                      <div className="h-full bg-primary/60 rounded-lg transition-all" style={{ width: `${width}%` }} />
                    </div>
                    <span className="text-[12px] font-bold text-foreground w-12 text-right">{reached}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                    <span className="inline-flex items-center gap-0.5"><BarChart3 className="w-3 h-3" /> {stage.triggerType}</span>
                    {stage.overlayText && <span className="truncate">{stage.overlayText.slice(0, 60)}…</span>}
                  </div>
                  <StageIntensitySliders
                    stage={stage}
                    onSaved={(updated) => setStages((ss) => ss.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)))}
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {editStage && (
        <StageEditor
          stage={editStage}
          onClose={() => setEditStage(null)}
          onSaved={(updated) => {
            setStages((ss) => ss.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)));
            setEditStage(null);
          }}
        />
      )}
    </Shell>
  );
}

function Shell({ children }) {
  return (
    <div className="min-h-screen bg-background p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Story-Dashboard</h1>
      </div>
      {children}
    </div>
  );
}

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-border bg-elevated p-3">
      <Icon className="w-4 h-4 text-primary mb-1" />
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function MiniStat({ icon: Icon, value }) {
  return (
    <span className="inline-flex items-center gap-1 text-muted-foreground font-semibold">
      <Icon className="w-3.5 h-3.5" /> {value}
    </span>
  );
}