import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { structureOf } from "@/lib/siteStructure";
import { moduleLabelFor } from "@/lib/modules";
import { loadLayout } from "@/lib/siteLayout";
import { cn } from "@/lib/utils";
import { Lock, Loader2, Layers, GitBranch, AlertTriangle, ArrowLeft, ArrowRight, StickyNote, Pencil } from "lucide-react";

// Struktur-Übersicht: alle Seiten als nummerierte Karten (seitenweise) und
// als Verzweigung von oben nach unten. Doppelte Ziele werden markiert — dort
// überschneidet sich die Leiste. Pro Eintrag lässt sich eine Bemerkung
// hinterlegen. Sortieren/Löschen selbst geht in der Besitzer-Konsole.
const noteKey = (id) => `struktur-note:${id}`;
const loadNote = (id) => { try { return localStorage.getItem(noteKey(id)) || ""; } catch { return ""; } };
const saveNote = (id, v) => { try { localStorage.setItem(noteKey(id), v); } catch {} };

const PER_PAGE = 4;

export default function Struktur() {
  const [me, setMe] = useState(null);
  const [meLoading, setMeLoading] = useState(true);
  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("seiten");
  const [page, setPage] = useState(1);
  const [notes, setNotes] = useState({});
  const [editingNote, setEditingNote] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => setMe(null)).finally(() => setMeLoading(false));
    loadLayout().then((r) => setRecord(r)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const structure = useMemo(() => structureOf(record), [record]);

  const allItems = useMemo(() => {
    const out = [];
    (structure.areas || []).forEach((area, ai) => {
      (area.items || []).forEach((it, ii) => {
        out.push({ ...it, areaLabel: area.label, areaId: area.id, number: `${ai + 1}.${ii + 1}` });
      });
    });
    return out;
  }, [structure]);

  const dupPaths = useMemo(() => {
    const counts = new Map();
    allItems.forEach((it) => counts.set(it.path, (counts.get(it.path) || 0) + 1));
    return new Set([...counts.entries()].filter(([, c]) => c > 1).map(([p]) => p));
  }, [allItems]);

  const totalPages = Math.max(1, Math.ceil(allItems.length / PER_PAGE));
  const pageItems = allItems.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  if (meLoading || loading)
    return <div className="flex min-h-[40vh] items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  if (!me || me.role !== "admin") {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Lock className="mx-auto h-8 w-8 text-muted-foreground" />
        <h1 className="mt-3 font-display text-2xl text-foreground">Nur für Admin</h1>
        <p className="mt-2 text-sm text-muted-foreground">Melde dich als Admin an, um die Struktur zu sehen.</p>
      </div>
    );
  }

  const setNote = (id, v) => { saveNote(id, v); setNotes((n) => ({ ...n, [id]: v })); };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="font-display text-4xl text-foreground text-gloss">Struktur-Übersicht</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Alle Seiten als Karten und als Verzweigung — sieh, wo sich Menüs überschneiden und am selben Ziel ankommen.
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-3 text-xs">
        <span className="font-heading text-foreground">{allItems.length} Einträge</span>
        <span className="text-muted-foreground">· {new Set(allItems.map((i) => i.path)).size} eindeutige Ziele</span>
        {dupPaths.size > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-1 font-semibold text-amber-300">
            <AlertTriangle className="w-3 h-3" /> {dupPaths.size} doppelte Ziele
          </span>
        )}
        <Link to="/owner" className="ml-auto glass-btn glass-btn-accent inline-flex items-center gap-1 rounded-full px-3 py-1.5 font-semibold">
          <Pencil className="w-3.5 h-3.5" /> Hier sortieren / löschen
        </Link>
      </div>

      <div className="mt-4 flex gap-1">
        {[{ k: "seiten", l: "Seitenansicht", i: Layers }, { k: "verzweigung", l: "Verzweigung", i: GitBranch }].map((t) => {
          const Icon = t.i;
          return (
            <button key={t.k} onClick={() => setTab(t.k)} className={cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm", tab === t.k ? "glass-btn glass-btn-accent" : "glass-btn text-muted-foreground")}>
              <Icon className="w-4 h-4" /> {t.l}
            </button>
          );
        })}
      </div>

      {tab === "seiten" && (
        <div className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            {pageItems.map((it) => {
              const dup = dupPaths.has(it.path);
              const note = notes[it.id] ?? loadNote(it.id);
              const editing = editingNote === it.id;
              return (
                <div key={it.id} className={cn("rounded-2xl border-2 bg-card p-4", dup ? "border-amber-500/50" : "border-border")}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary">{it.number}</span>
                      <h3 className="mt-2 font-display text-lg text-foreground truncate">{it.label || moduleLabelFor(it.path)}</h3>
                      <p className="truncate text-xs text-muted-foreground">{it.areaLabel} · {it.path}</p>
                    </div>
                    {dup && <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-1 text-[10px] font-bold text-amber-300">↻ gleices Ziel</span>}
                  </div>
                  <div className="mt-3">
                    {editing ? (
                      <textarea value={note} onChange={(e) => setNote(it.id, e.target.value)} onBlur={() => setEditingNote(null)} autoFocus
                        placeholder="Bemerkung …" rows={2}
                        className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-xs text-foreground" />
                    ) : (
                      <button onClick={() => setEditingNote(it.id)} className="flex w-full items-center gap-1.5 rounded-lg bg-elevated px-2 py-1.5 text-left text-xs text-muted-foreground hover:text-foreground">
                        <StickyNote className="w-3.5 h-3.5" /> {note || "Bemerkung hinzufügen …"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="glass-btn inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs disabled:opacity-40"><ArrowLeft className="w-3.5 h-3.5" /> Zurück</button>
            <span className="text-xs text-muted-foreground">Seite {page} / {totalPages}</span>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="glass-btn inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs disabled:opacity-40">Weiter <ArrowRight className="w-3.5 h-3.5" /></button>
          </div>
        </div>
      )}

      {tab === "verzweigung" && (
        <div className="mt-4 rounded-2xl border-2 border-border bg-card p-4 overflow-x-auto">
          <div className="flex justify-center">
            <div className="rounded-2xl bg-primary px-4 py-2 font-display text-primary-foreground">Artanis × Tania <span className="opacity-70">· /</span></div>
          </div>
          <div className="mx-auto w-px h-6 bg-border" />
          <div className="flex flex-wrap justify-center gap-4">
            {(structure.areas || []).map((area) => (
              <div key={area.id} className="flex flex-col items-center">
                <div className="rounded-full border-2 border-border bg-elevated px-3 py-1.5 text-xs font-bold text-foreground">{area.label}</div>
                <div className="mt-2 space-y-1">
                  {(area.items || []).map((it) => {
                    const dup = dupPaths.has(it.path);
                    return (
                      <div key={it.id} className={cn("rounded-lg border px-2 py-1 text-[11px] text-foreground whitespace-nowrap", dup ? "border-amber-500/60 bg-amber-500/10" : "border-border bg-background")}>
                        {it.label || moduleLabelFor(it.path)}
                        {dup && <span className="ml-1 text-amber-400">↻</span>}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          {dupPaths.size > 0 && (
            <p className="mt-4 text-center text-xs text-amber-300">
              <AlertTriangle className="mr-1 inline w-3.5 h-3.5" />
              {dupPaths.size} Ziel(e) werden aus mehreren Bereichen erreicht — dort überschneidet sich die Leiste.
            </p>
          )}
        </div>
      )}

      <p className="mt-5 text-xs text-muted-foreground">
        Sortieren, umbenennen, ausblenden und löschen geht in der{" "}
        <Link to="/owner" className="text-primary underline">Besitzer-Konsole</Link>. Die 3D-Kugel-Ansicht und das
        direkte Ziehen auf der Seite folgen im nächsten Schritt.
      </p>
    </div>
  );
}