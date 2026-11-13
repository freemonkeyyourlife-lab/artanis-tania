import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Clock, Users, ArrowDownUp, Archive as ArchiveIcon, ArrowLeft, Share2 } from "lucide-react";
import { THERAPY_MODES, ROLE_SETUPS, roleLabel, therapistName, formatLabel } from "@/lib/therapyPrompts";
import { cn } from "@/lib/utils";
import VorlagenTeilenDialog from "@/components/vorlagen/VorlagenTeilenDialog";

const SORTS = [
  { id: "newest", label: "Datum · neu" },
  { id: "oldest", label: "Datum · alt" },
  { id: "character", label: "Charakter · A–Z" },
  { id: "longest", label: "Längste" },
];

const durationOf = (s) => {
  if (!s.lastMessageAt || !s.created_date) return null;
  const ms = new Date(s.lastMessageAt).getTime() - new Date(s.created_date).getTime();
  if (!ms || ms < 0) return null;
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `${mins} Min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} Std ${m} Min` : `${h} Std`;
};

// Wer dabei war — mit Rolle, damit die Rollenverteilung sofort sichtbar wird.
const participantsOf = (s) => {
  const list = [];
  const name = therapistName(s);
  const role = s.roleSetup || "TANIA_THERAPIST";
  if (role === "USER_THERAPIST") {
    list.push({ name: s.userName || "Du", kind: "Therapeut (Du)" });
    list.push({ name, kind: "Probandin" });
  } else if (role === "BOTH_PROBANDS") {
    list.push({ name: s.userName || "Du", kind: "Proband" });
    list.push({ name, kind: "Probandin" });
  } else {
    list.push({ name, kind: "Therapeutin" });
    list.push({ name: s.userName || "Du", kind: "Klient" });
  }
  if (s.actor?.active) list.push({ name: s.actor.name || "Akteur", kind: "Akteur" });
  (s.cast || []).filter((c) => c.mode === "PRESENT").forEach((c) => list.push({ name: c.name, kind: "Gast" }));
  return list;
};

const sessionToVorlage = (s) => ({
  name: s.topic || "Sitzungs-Setup",
  purpose: "SITZUNG",
  setup: {
    roleSetup: s.roleSetup,
    mode: s.mode,
    intensity: s.intensity,
    therapistName: therapistName(s),
    therapistAge: s.therapistAge,
    therapistType: s.therapistType,
    therapistStyle: s.therapistStyle,
    therapistRole: s.therapistRole,
    therapistVoice: s.therapistVoice,
    cast: s.cast || [],
    actor: s.actor || {},
    topic: s.topic,
  },
});

const Avatar = ({ name }) => (
  <span className="w-7 h-7 rounded-full bg-elevated border border-border flex items-center justify-center text-[11px] font-bold text-foreground">
    {(name || "?").trim().slice(0, 1).toUpperCase()}
  </span>
);

export default function TherapyArchiv() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("newest");
  const [teilen, setTeilen] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me().catch(() => null);
        if (!user) { setLoading(false); return; }
        const own = await base44.entities.TherapySession.filter(
          { userId: user.id, status: "DONE" },
          "-created_date",
          100
        );
        setSessions(own);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sorted = useMemo(() => {
    const arr = [...sessions];
    const dur = (s) => (durationOf(s) ? new Date(s.lastMessageAt).getTime() - new Date(s.created_date).getTime() : 0);
    if (sort === "newest") arr.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    else if (sort === "oldest") arr.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    else if (sort === "character") arr.sort((a, b) => therapistName(a).localeCompare(therapistName(b), "de"));
    else if (sort === "longest") arr.sort((a, b) => dur(b) - dur(a));
    return arr;
  }, [sessions, sort]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 lg:px-8 py-8">
      <Link to="/therapy" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Sprechstunde
      </Link>

      <div className="flex items-center gap-2 mb-1">
        <ArchiveIcon className="w-5 h-5 text-primary" />
        <p className="text-[11px] font-semibold tracking-wider uppercase text-primary">Archiv</p>
      </div>
      <h1 className="font-display text-3xl text-foreground">Abgeschlossene Sitzungen</h1>
      <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
        Wie lange, wer dabei war und wer welche Rolle hatte — sortiert nach Datum oder Therapeutin.
      </p>

      <div className="flex items-center gap-2 mt-6 mb-4 flex-wrap">
        <ArrowDownUp className="w-3.5 h-3.5 text-muted-foreground" />
        {SORTS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSort(s.id)}
            className={cn(
              "px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors",
              sort === s.id ? "bg-primary text-primary-foreground" : "bg-elevated border border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">Noch keine beendeten Sitzungen.</p>
      ) : (
        <div className="space-y-2">
          {sorted.map((s) => {
            const mode = THERAPY_MODES.find((m) => m.value === s.mode);
            const role = ROLE_SETUPS.find((r) => r.value === (s.roleSetup || "TANIA_THERAPIST"));
            const name = therapistName(s);
            const dur = durationOf(s);
            const ppl = participantsOf(s);
            return (
              <Link
                key={s.id}
                to={`/therapy/${s.id}`}
                className="block rounded-2xl border border-border bg-card p-4 hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      <span className="px-2.5 py-1 rounded-full bg-primary/15 text-primary text-[11px] font-semibold">
                        {roleLabel(s)}
                      </span>
                      {(s.format || "EINZEL") === "SERIE" && (
                        <span className="px-2.5 py-1 rounded-full bg-elevated text-muted-foreground text-[11px]">
                          {s.seriesTitle ? `${s.seriesTitle} · ` : ""}{formatLabel(s)}
                        </span>
                      )}
                      {mode && <span className="px-2.5 py-1 rounded-full bg-elevated text-muted-foreground text-[11px]">{mode.label}</span>}
                      {s.visibility === "PRIVATE" && (
                        <span className="px-2.5 py-1 rounded-full bg-elevated text-muted-foreground text-[11px]">vertraulich</span>
                      )}
                    </div>
                    <p className="text-[15px] text-foreground leading-snug line-clamp-2">{s.topic}</p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground flex-wrap">
                      <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {dur || "—"}</span>
                      <span>{format(new Date(s.created_date), "dd.MM.yy, HH:mm", { locale: de })}</span>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {ppl.map((p, i) => (
                        <span key={i} className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-elevated border border-border text-[11px] text-foreground">
                          <span className="font-semibold">{p.name}</span>
                          <span className="text-muted-foreground">· {p.kind}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-end gap-1.5">
                    <div className="flex items-center">
                      {ppl.slice(0, 4).map((p, i) => (
                        <span key={i} className="-ml-2 first:ml-0 ring-2 ring-card rounded-full"><Avatar name={p.name} /></span>
                      ))}
                      {ppl.length > 4 && <span className="ml-1 text-[11px] text-muted-foreground">+{ppl.length - 4}</span>}
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"><Users className="w-3 h-3" /> {ppl.length}</span>
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setTeilen(sessionToVorlage(s)); }}
                      title="Setup per E-Mail an Partnerin senden"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-elevated border border-border text-[11px] text-foreground hover:border-primary/50 transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" /> An Partnerin
                    </button>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <VorlagenTeilenDialog open={!!teilen} vorlage={teilen} onClose={() => setTeilen(null)} />
    </div>
  );
}