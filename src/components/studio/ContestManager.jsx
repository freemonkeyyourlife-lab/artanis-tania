import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Pencil, Trash2, Eye, EyeOff, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import ContestForm from "@/components/studio/ContestForm";
import { categoryOf, statusOf, statusLabel, statusClass, formatDate } from "@/lib/contests";

export default function ContestManager() {
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try { setContests(await base44.entities.Contest.list("-created_date")); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const remove = async (c) => {
    if (!window.confirm(`"${c.title}" wirklich löschen?`)) return;
    await base44.entities.ContestEntry.deleteMany({ contestId: c.id }).catch(() => {});
    await base44.entities.Contest.delete(c.id);
    load();
  };

  const toggle = async (c, key) => {
    await base44.entities.Contest.update(c.id, { [key]: !c[key] });
    load();
  };

  if (loading) {
    return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setEditing("new")} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
          <Plus className="w-4 h-4" /> Neuer Wettbewerb
        </button>
      </div>

      {editing && (
        <div className="mb-6">
          <ContestForm
            initial={editing === "new" ? null : editing}
            onSaved={() => { setEditing(null); load(); }}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {contests.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">Noch keine Wettbewerbe — leg deinen ersten an.</p>
      ) : (
        <div className="space-y-3">
          {contests.map((c) => {
            const cat = categoryOf(c);
            const st = statusOf(c);
            return (
              <div key={c.id} className="rounded-2xl border border-border bg-card p-4 flex flex-wrap items-start gap-4">
                <span className="text-2xl leading-none flex-shrink-0">{cat.icon}</span>
                <div className="flex-1 min-w-[220px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground">{c.title}</p>
                    <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase", statusClass(st))}>{statusLabel(st)}</span>
                    {c.juryMode && <span className="px-2 py-0.5 rounded-full bg-elevated text-muted-foreground text-[10px] font-semibold uppercase">Jury</span>}
                    {!c.published && <span className="px-2 py-0.5 rounded-full bg-elevated text-muted-foreground text-[10px] font-semibold uppercase">Entwurf</span>}
                    {c.featured && <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold uppercase">Hervorgehoben</span>}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {cat.label} · Runde {c.round || 1} · {c.entriesOpen ? "Einsendungen offen" : "Einsendungen zu"} · max. {c.maxEntriesPerUser || 1} pro Nutzer
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {formatDate(c.startsAt) || "kein Start"} – {formatDate(c.endsAt) || "kein Ende"}
                    {c.votingEnabled ? ` · ${c.votesPerUser || 1} Stimme(n) pro Nutzer` : " · keine Abstimmung"}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => toggle(c, "published")} title={c.published ? "Verbergen" : "Veröffentlichen"} className="w-9 h-9 rounded-full bg-elevated border border-border text-muted-foreground flex items-center justify-center hover:text-foreground transition-colors">
                    {c.published ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => setEditing(c)} title="Bearbeiten" className="w-9 h-9 rounded-full bg-elevated border border-border text-muted-foreground flex items-center justify-center hover:text-foreground transition-colors">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => remove(c)} title="Löschen" className="w-9 h-9 rounded-full bg-destructive/15 text-destructive flex items-center justify-center hover:bg-destructive/25 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-1">
            <Trophy className="w-3.5 h-3.5" /> Gewinner küren und Beiträge freigeben: im Wettbewerb selbst auf „Contests" klicken.
          </p>
        </div>
      )}
    </div>
  );
}