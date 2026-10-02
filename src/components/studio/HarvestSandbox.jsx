import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Radar, Loader2, ArrowDownToLine } from "lucide-react";
import { cn } from "@/lib/utils";
import HarvestEditGroup from "@/components/studio/HarvestEditGroup";
import HarvestButtonGuide from "@/components/studio/HarvestButtonGuide";
import { saveHarvest, modelKindOf } from "@/lib/harvestImport";

const GROUPS = [
  { id: "MODELL", label: "Modelle" },
  { id: "CHARAKTER", label: "Charaktere" },
  { id: "BILD", label: "Bilder" },
  { id: "VIDEO", label: "Videos" },
  { id: "AUDIO", label: "Audio" },
  { id: "LINK", label: "Links" },
];

const MEDIA_KINDS = ["BILD", "VIDEO", "AUDIO"];

const toRow = (it, i) => ({
  rid: `r${i}-${it.url}`,
  url: it.url,
  kind: it.kind,
  label: it.label || it.host || it.url,
  host: it.host || "",
  ok: it.ok !== false,
  image: it.image || "",
  modelKind: it.kind === "MODELL" ? modelKindOf(it.url) : "",
  note: "",
  tagline: "",
  bio: "",
  category: it.host || "",
});

// Dieselbe Sammel-Aktion wie im Sammel-Import — nur bleibt hier vor dem
// Speichern alles stehen und darf in Ruhe umgeschrieben werden.
export default function HarvestSandbox({ creators = [] }) {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [deep, setDeep] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [rows, setRows] = useState(null);
  const [pages, setPages] = useState([]);
  const [blocked, setBlocked] = useState([]);
  const [selected, setSelected] = useState(() => new Set());
  const [creatorId, setCreatorId] = useState("");

  const chosen = (rows || []).filter((r) => selected.has(r.rid));
  const needsCreator = chosen.some((r) => MEDIA_KINDS.includes(r.kind));

  const run = async () => {
    const address = url.trim();
    if (!address || busy) return;
    setBusy(true);
    setRows(null);
    setSelected(new Set());
    try {
      const res = await base44.functions.invoke("linkHarvest", { url: address, deep });
      if (res.data?.error) throw new Error(res.data.error);
      const found = res.data?.items || [];
      const next = found.map(toRow);
      setRows(next);
      setPages(res.data.pages || []);
      setBlocked(res.data.blocked || []);
      setSelected(new Set(next.map((r) => r.rid)));
      toast({
        title: found.length ? `${found.length} Fundstücke` : "Nichts zum Einsammeln",
        description: found.length
          ? `${(res.data.pages || []).length} Seite(n) gelesen — jetzt prüfen und ändern.`
          : "Auf dieser Seite war nichts, was hier hineinpasst.",
      });
    } catch (e) {
      toast({ title: "Seite ließ sich nicht lesen", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const toggle = (rid) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(rid)) next.delete(rid);
      else next.add(rid);
      return next;
    });

  const setAll = (list, on) =>
    setSelected((prev) => {
      const next = new Set(prev);
      list.forEach((r) => (on ? next.add(r.rid) : next.delete(r.rid)));
      return next;
    });

  const change = (rid, patch) =>
    setRows((prev) => prev.map((r) => (r.rid === rid ? { ...r, ...patch } : r)));

  const save = async () => {
    if (!chosen.length || saving) return;
    setSaving(true);
    try {
      const { saved, skipped, mediaWithoutCreator } = await saveHarvest({ items: chosen, creators, creatorId });

      const parts = [];
      if (saved.MODELL) parts.push(`${saved.MODELL} Modelle`);
      if (saved.CHARAKTER) parts.push(`${saved.CHARAKTER} Charaktere`);
      if (saved.LINK) parts.push(`${saved.LINK} Links`);
      if (saved.MEDIEN) parts.push(`${saved.MEDIEN} Medien`);

      const notes = [];
      if (skipped.MODELL || skipped.LINK || skipped.CHARAKTER) notes.push("Schon Vorhandenes blieb draußen.");
      if (mediaWithoutCreator) notes.push(`${mediaWithoutCreator} Medien brauchen einen Ziel-Charakter.`);

      toast({
        title: parts.length ? `Übernommen: ${parts.join(", ")}` : "Nichts übernommen",
        description: notes.join(" ") || undefined,
      });

      const done = new Set(chosen.map((r) => r.rid));
      setRows((prev) => prev.filter((r) => !done.has(r.rid)));
      setSelected(new Set());
    } catch (e) {
      toast({ title: "Speichern hat nicht geklappt", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const list = rows || [];

  return (
    <div className="glass rounded-2xl border-2 border-border p-6">
      <p className="font-display text-2xl text-foreground mb-1">Import-Sandbox</p>
      <p className="text-[15px] font-semibold text-muted-foreground mb-5 max-w-3xl">
        Erst sammeln, dann in Ruhe durchsehen: Name, Adresse, Art und Notizen darfst du hier frei ändern — gespeichert
        wird erst mit „Übernehmen“.
      </p>

      <HarvestButtonGuide />

      <div className="rounded-2xl border border-border bg-card p-4 mb-5">
        <div className="flex flex-wrap gap-2">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && run()}
            placeholder="https://… die erste Seite"
            className="flex-[3] min-w-[260px] h-11 text-[15px] font-semibold"
          />
          <button
            onClick={() => setDeep((v) => !v)}
            className={cn(
              "px-5 h-11 rounded-full text-[14px] font-bold transition-colors whitespace-nowrap",
              deep ? "glass-btn glass-btn-accent text-gloss" : "glass-btn text-muted-foreground"
            )}
          >
            {deep ? "Mit Unterseiten ✓" : "Nur diese Seite"}
          </button>
          <button
            onClick={run}
            disabled={busy || !url.trim()}
            className="inline-flex items-center gap-2 px-6 h-11 rounded-full bg-primary text-primary-foreground text-[15px] font-bold disabled:opacity-50 whitespace-nowrap"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Radar className="w-4 h-4" />}
            Seite durchsuchen
          </button>
        </div>
        {busy && (
          <p className="mt-3 text-[13px] font-semibold text-muted-foreground">
            Die Seite wird gelesen — das dauert einen Moment.
          </p>
        )}
      </div>

      {rows !== null && (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-[13px] font-bold text-foreground">
              {list.length} Fundstücke · {chosen.length} gewählt
            </span>
            <span className="text-[12px] font-semibold text-muted-foreground">
              {pages.length} Seite(n) gelesen
            </span>
            {blocked.length > 0 && (
              <span className="text-[12px] font-semibold text-destructive">
                {blocked.length} Seite(n) ließen sich nicht lesen
              </span>
            )}
          </div>

          {list.length === 0 ? (
            <p className="text-[15px] font-semibold text-muted-foreground text-center py-10">
              Hier ist gerade nichts mehr — trag oben eine andere Adresse ein.
            </p>
          ) : (
            <div className="space-y-3">
              {GROUPS.map((g) => (
                <HarvestEditGroup
                  key={g.id}
                  label={g.label}
                  rows={list.filter((r) => r.kind === g.id)}
                  selected={selected}
                  onToggle={toggle}
                  onChange={change}
                  onAll={setAll}
                />
              ))}
            </div>
          )}

          {needsCreator && (
            <div className="mt-4 rounded-2xl border border-border bg-card p-4">
              <p className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                Ziel-Charakter für Bilder, Videos und Audio
              </p>
              {creators.length === 0 ? (
                <p className="text-[13px] font-semibold text-muted-foreground">
                  Noch kein Charakter da — leg erst einen an, dann landen die Medien bei ihm.
                </p>
              ) : (
                <select
                  value={creatorId}
                  onChange={(e) => setCreatorId(e.target.value)}
                  className="w-full max-w-md px-4 py-2.5 rounded-xl bg-background border border-border text-[15px] font-semibold text-foreground"
                >
                  <option value="">Bitte wählen …</option>
                  {creators.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.stageName}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <button
            onClick={save}
            disabled={saving || chosen.length === 0 || (needsCreator && !creatorId)}
            className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 rounded-full glass-btn glass-btn-accent text-[15px] font-bold text-gloss disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowDownToLine className="w-4 h-4" />}
            Übernehmen ({chosen.length})
          </button>
        </>
      )}
    </div>
  );
}