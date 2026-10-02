import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Power, ExternalLink, Loader2, Star, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import HfModelSearch from "@/components/studio/HfModelSearch";
import ModelKindTag from "@/components/studio/ModelKindTag";
import ModelTags from "@/components/studio/ModelTags";
import ModelTagsPicker from "@/components/studio/ModelTagsPicker";
import ModelFilterBar from "@/components/studio/ModelFilterBar";
import ModelExplainBox from "@/components/studio/ModelExplainBox";
import { emptyTags, matchesFilter } from "@/lib/modelTags";
import { explainModel } from "@/lib/modelExplain";

const inputCls =
  "w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50";

const SOURCES = [
  { value: "HUGGING_FACE", label: "Hugging Face", hint: "Dein Konto ist verbunden. Die großen Modelle brauchen dort Guthaben, kleine laufen sofort." },
  { value: "POLLINATIONS", label: "Pollinations", hint: "Kostenlos, ohne Anmeldung und ohne Guthaben — dafür einfachere Qualität." },
  { value: "FAL_AI", label: "fal.ai", hint: "Höchste Bildqualität — läuft über deinen fal.ai-Schlüssel und wird pro Bild abgerechnet." },
];

// Bildmodelle, die im Generator als Quelle wählbar sind.
export default function ModelManager() {
  const { toast } = useToast();
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", modelId: "", note: "" });
  const [source, setSource] = useState("HUGGING_FACE");
  const [account, setAccount] = useState(null);
  const [tags, setTags] = useState(emptyTags());
  const [filter, setFilter] = useState({ style: "", explicit: "", moods: [] });
  const [explaining, setExplaining] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const list = await base44.entities.ImageModel.list("created_date");
      // Favoriten stehen oben — die besten Modelle sind sofort zur Hand.
      setModels([...list].sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0)));
    }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const add = async () => {
    if (!form.name.trim() || (!form.modelId.trim() && source !== "POLLINATIONS")) {
      toast({ title: "Name und Modell-ID fehlen", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await base44.entities.ImageModel.create({
        name: form.name.trim(),
        modelId: form.modelId.trim() || "default",
        note: form.note.trim(),
        source,
        enabled: true,
        ...tags,
      });
      setForm({ name: "", modelId: "", note: "" });
      setTags(emptyTags());
      await load();
      toast({ title: "Modell drin", description: "Im Generator jetzt als Quelle wählbar." });
    } catch (e) {
      toast({ title: "Konnte nicht speichern", variant: "destructive" });
    } finally { setBusy(false); }
  };

  const toggle = async (m) => {
    await base44.entities.ImageModel.update(m.id, { enabled: !m.enabled });
    load();
  };

  // Kategorien direkt am Modell festhalten — Stil, Freizügigkeit, Stimmung.
  const saveTags = async (m, next) => {
    await base44.entities.ImageModel.update(m.id, next);
    load();
  };

  // Erklärung am Modell festhalten — sie steht dann überall dort, wo man wählt.
  const saveDescription = async (m, description) => {
    await base44.entities.ImageModel.update(m.id, { description });
    load();
  };

  const explainMissing = async () => {
    const open = models.filter((m) => !m.description);
    if (!open.length) return;
    setExplaining(true);
    try {
      for (const m of open) {
        const description = await explainModel({ name: m.name, modelId: m.modelId, source: m.source, kind: "BILD" });
        if (description) await base44.entities.ImageModel.update(m.id, { description });
      }
      await load();
      toast({ title: "Erklärungen ergänzt", description: `${open.length} Modelle sind jetzt beschrieben.` });
    } catch (e) {
      toast({ title: "Nicht für alle geklappt", description: "Versuch es für die restlichen nochmal.", variant: "destructive" });
    } finally {
      setExplaining(false);
    }
  };

  const toggleFavorite = async (m) => {
    await base44.entities.ImageModel.update(m.id, { favorite: !m.favorite });
    load();
  };

  const remove = async (m) => {
    if (!window.confirm(`"${m.name}" entfernen?`)) return;
    await base44.entities.ImageModel.delete(m.id);
    load();
  };

  const visible = models.filter((m) => matchesFilter(m, filter));
  const missing = models.filter((m) => !m.description);

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="lg:col-span-2 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4">
        <ModelKindTag kind="BILD" />
        <span className={cn("w-2 h-2 rounded-full", account ? "bg-emerald-400" : "bg-amber-400")} />
        <p className="text-sm text-foreground">
          Hugging Face: {account ? `verbunden als ${account}` : "Verbindung wird geprüft …"}
        </p>
        <a
          href="https://huggingface.co/settings/billing"
          target="_blank"
          rel="noreferrer"
          className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" /> Guthaben verwalten
        </a>
      </div>

      {source === "HUGGING_FACE" && (
        <HfModelSearch existingIds={models.map((m) => m.modelId)} onAdded={load} onAccount={setAccount} />
      )}

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-xl text-foreground mb-1">Modell hinzufügen</h2>
        <p className="text-xs text-muted-foreground mb-5">
          Modell auswählen, ID einfügen, fertig. Im Generator ist es dann als Quelle wählbar.
        </p>

        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Plattform</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {SOURCES.map((s) => (
            <button
              key={s.value}
              onClick={() => setSource(s.value)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-semibold transition-colors",
                source === s.value ? "bg-primary text-primary-foreground" : "bg-elevated border border-border text-muted-foreground"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mb-5">{SOURCES.find((s) => s.value === source)?.hint}</p>

        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Anzeigename</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="z. B. Flux schnell"
          className={cn(inputCls, "mb-4")}
        />

        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Modell-ID</label>
        <input
          value={form.modelId}
          onChange={(e) => setForm({ ...form, modelId: e.target.value })}
          placeholder={
            source === "POLLINATIONS"
              ? "default (oder z. B. sana)"
              : source === "FAL_AI"
                ? "fal-ai/flux/schnell"
                : "black-forest-labs/FLUX.1-schnell"
          }
          className={cn(inputCls, "mb-4")}
        />

        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Notiz (optional)</label>
        <input
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          placeholder="Wofür nimmst du es?"
          className={cn(inputCls, "mb-5")}
        />

        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Kategorien
        </p>
        <div className="mb-5">
          <ModelTagsPicker kind="BILD" value={tags} onChange={setTags} />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={add}
            disabled={busy}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Hinzufügen
          </button>
          {source === "HUGGING_FACE" && (
            <a
              href="https://huggingface.co/models?pipeline_tag=text-to-image"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Modelle durchsuchen
            </a>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Deine Modelle ({visible.length} von {models.length})
          </p>
          {missing.length > 0 && (
            <button
              onClick={explainMissing}
              disabled={explaining}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-elevated border border-border text-[11px] font-semibold text-foreground disabled:opacity-50"
            >
              {explaining ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3 text-primary" />}
              {explaining ? "Erklärt …" : `Fehlende erklären (${missing.length})`}
            </button>
          )}
        </div>

        <ModelFilterBar kind="BILD" models={models} value={filter} onChange={setFilter} />

        {models.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Noch keine Modelle hinterlegt — füge links dein erstes hinzu.
          </p>
        ) : visible.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Kein Modell passt zu dieser Kategorie — setz den Filter zurück.
          </p>
        ) : (
          <div className="space-y-2">
            {visible.map((m) => (
              <div key={m.id} className={cn("flex items-center gap-3 p-3 rounded-xl bg-elevated border border-border", !m.enabled && "opacity-60")}>
                <button
                  onClick={() => toggleFavorite(m)}
                  title={m.favorite ? "Favorit entfernen" : "Als Favorit merken"}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                    m.favorite ? "bg-amber-500/20 text-amber-400" : "bg-background border border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  <Star className={cn("w-3.5 h-3.5", m.favorite && "fill-current")} />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {(SOURCES.find((s) => s.value === m.source) || SOURCES[0]).label} · {m.modelId}
                  </p>
                  {m.note && <p className="text-[11px] text-muted-foreground truncate">{m.note}</p>}
                  <ModelTags kind="BILD" model={m} editable className="mt-1.5" onSave={(t) => saveTags(m, t)} />
                  <ModelExplainBox model={m} kind="BILD" onSave={(d) => saveDescription(m, d)} />
                </div>
                <button
                  onClick={() => toggle(m)}
                  title={m.enabled ? "Im Generator ausblenden" : "Im Generator anzeigen"}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors",
                    m.enabled ? "bg-emerald-600/20 text-emerald-400" : "bg-background border border-border text-muted-foreground"
                  )}
                >
                  <Power className="w-3 h-3" /> {m.enabled ? "An" : "Aus"}
                </button>
                <button
                  onClick={() => remove(m)}
                  className="w-8 h-8 rounded-full bg-destructive/15 text-destructive flex items-center justify-center hover:bg-destructive/25 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}