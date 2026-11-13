import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { Clock, Users, Lock, ArrowDownUp } from "lucide-react";
import { THERAPY_MODES, formatLabel, therapistName } from "@/lib/therapyPrompts";
import { cn } from "@/lib/utils";

const SORTS = [
  { id: "newest", label: "Neueste" },
  { id: "oldest", label: "Älteste" },
  { id: "longest", label: "Längste" },
  { id: "people", label: "Teilnehmer" },
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

// Wer dabei war: Therapeutin, Akteur (wenn er mitspielt), jede anwesende Figur.
const participantsOf = (s) => {
  const list = [{ name: therapistName(s), kind: "Therapeutin" }];
  if (s.actor?.active) list.push({ name: s.actor.name || "Akteur", kind: "Akteur" });
  (s.cast || []).filter((c) => c.mode === "PRESENT").forEach((c) => list.push({ name: c.name, kind: "Gast" }));
  return list;
};

const Avatar = ({ name }) => (
  <span className="w-7 h-7 rounded-full bg-elevated border border-border flex items-center justify-center text-[11px] font-bold text-foreground">
    {(name || "?").trim().slice(0, 1).toUpperCase()}
  </span>
);

export default function SessionsOverview({ sessions = [] }) {
  const [sort, setSort] = useState("newest");

  const sorted = useMemo(() => {
    const arr = [...sessions];
    const dur = (s) => (durationOf(s) ? new Date(s.lastMessageAt).getTime() - new Date(s.created_date).getTime() : 0);
    const ppl = (s) => participantsOf(s).length;
    if (sort === "newest") arr.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    else if (sort === "oldest") arr.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    else if (sort === "longest") arr.sort((a, b) => dur(b) - dur(a));
    else if (sort === "people") arr.sort((a, b) => ppl(b) - ppl(a));
    return arr;
  }, [sessions, sort]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
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

      <div className="space-y-2">
        {sorted.map((s) => {
          const mode = THERAPY_MODES.find((m) => m.value === s.mode);
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
                      {s.roleSetup === "USER_THERAPIST" ? "Du führst" : `${name} führt`}
                    </span>
                    {(s.format || "EINZEL") === "SERIE" && (
                      <span className="px-2.5 py-1 rounded-full bg-elevated text-muted-foreground text-[11px]">
                        {s.seriesTitle ? `${s.seriesTitle} · ` : ""}{formatLabel(s)}
                      </span>
                    )}
                    {mode && <span className="px-2.5 py-1 rounded-full bg-elevated text-muted-foreground text-[11px]">{mode.label}</span>}
                    {s.status === "DONE" && <span className="px-2.5 py-1 rounded-full bg-elevated text-muted-foreground text-[11px]">beendet</span>}
                    {s.visibility === "PRIVATE" && (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-elevated text-muted-foreground text-[11px]"><Lock className="w-3 h-3" /> vertraulich</span>
                    )}
                  </div>
                  <p className="text-[15px] text-foreground leading-snug line-clamp-2">{s.topic}</p>
                  <div className="flex items-center gap-3 mt-2 text-[11px] text-muted-foreground flex-wrap">
                    <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /> {dur || "—"}</span>
                    <span>{s.anonymous ? "Anonym" : s.userName || "Unbekannt"}</span>
                    <span>{format(new Date(s.created_date), "dd.MM.yy, HH:mm", { locale: de })}</span>
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
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}