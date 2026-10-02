import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { Radar, Loader2, ArrowDownToLine } from "lucide-react";
import { cn } from "@/lib/utils";
import HarvestGroup from "@/components/studio/HarvestGroup";
import { saveHarvest } from "@/lib/harvestImport";

const GROUPS = [
  { id: "MODELL", label: "Modelle", note: "→ Modell-Links" },
  { id: "CHARAKTER", label: "Charaktere", note: "→ neue Profile" },
  { id: "BILD", label: "Bilder", note: "→ Inhalte" },
  { id: "VIDEO", label: "Videos", note: "→ Inhalte" },
  { id: "AUDIO", label: "Audio", note: "→ Inhalte" },
  { id: "LINK", label: "Links", note: "→ Dienste-Liste" },
];

const MEDIA_KINDS = ["BILD", "VIDEO", "AUDIO"];

// Eine Adresse eingeben — die Seite wird gelesen und alles Brauchbare
// herausgezogen. Anschließend Häkchen setzen und gesammelt übernehmen.
export default function SammelImport({ creators = [] }) {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [deep, setDeep] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState(() => new Set());
  const [creatorId, setCreatorId] = useState("");

  const items = result?.items || [];
  const chosen = items.filter((i) => selected.has(i.url));
  const needsCreator = chosen.some((i) => MEDIA_KINDS.includes(i.kind));

  const run = async () => {
    const address = url.trim();
    if (!address || busy) return;
    setBusy(true);
    setResult(null);
    setSelected(new Set());
    try {
      const res = await base44.functions.invoke("linkHarvest", { url: address, deep });
      if (res.data?.error) throw new Error(res.data.error);
      const found = res.data?.items || [];
      setResult(res.data);
      // Alles Gefundene ist gleich angehakt — abwählen geht genauso leicht.
      setSelected(new Set(found.map((i) => i.url)));
      toast({
        title: found.length ? `${found.length} Fundstücke` : "Nichts zum Einsammeln",
        description: found.length
          ? `${res.data.pages.length} Seite(n) gelesen.`
          : "Auf dieser Seite war nichts, was hier hineinpasst.",
      });
    } catch (e) {
      toast({ title: "Seite ließ sich nicht lesen", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const toggle = (key) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const setAll = (list, on) =>
    setSelected((prev) => {
      const next = new Set(prev);
      list.forEach((i) => (on ? next.add(i.url) : next.delete(i.url)));
      return next;
    });

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

      const doneKeys = new Set(chosen.map((i) => i.url));
      setResult((prev) => (prev ? { ...prev, items: prev.items.filter((i) => !doneKeys.has(i.url)) } : prev));
      setSelected(new Set());
    } catch (e) {
      toast({ title: "Speichern hat nicht geklappt", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass rounded-2xl border-2 border-border p-6">
      <p className="font-display text-2xl text-foreground mb-1">Sammel-Import</p>
      <p className="text-[15px] font-semibold text-muted-foreground mb-5 max-w-3xl">
        Nur die erste Adresse eintragen — die Seite wird gelesen und alles selbst herausgesucht: Modelle, Charaktere,
        Bilder, Videos, Audio und Links. Auf Wunsch geht es einen Schritt weiter und liest auch die Unterseiten.
      </p>

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

      {result && (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="text-[13px] font-bold text-foreground">
              {items.length} Fundstücke · {chosen.length} gewählt
            </span>
            {result.blocked?.length > 0 && (
              <span className="text-[12px] font-semibold text-destructive">
                {result.blocked.length} Seite(n) ließen sich nicht lesen
              </span>
            )}
          </div>

          {items.length === 0 ? (
            <p className="text-[15px] font-semibold text-muted-foreground text-center py-10">
              Hier ist gerade nichts mehr — trag oben eine andere Adresse ein.
            </p>
          ) : (
            <div className="space-y-3">
              {GROUPS.map((g) => (
                <HarvestGroup
                  key={g.id}
                  label={g.label}
                  note={g.note}
                  items={items.filter((i) => i.kind === g.id)}
                  selected={selected}
                  onToggle={toggle}
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