import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Trash2, Power, ExternalLink, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import HfModelSearch from "@/components/studio/HfModelSearch";
import ModelKindTag from "@/components/studio/ModelKindTag";

const inputCls =
  "w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50";

const SOURCES = [
  { value: "HUGGING_FACE", label: "Hugging Face", hint: "Dein Konto ist verbunden. Die großen Modelle brauchen dort Guthaben, kleine laufen sofort." },
  { value: "POLLINATIONS", label: "Pollinations", hint: "Kostenlos, ohne Anmeldung und ohne Guthaben — dafür einfachere Qualität." },
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

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { setModels(await base44.entities.ImageModel.list("created_date")); }
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
      });
      setForm({ name: "", modelId: "", note: "" });
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

  const remove = async (m) => {
    if (!window.confirm(`"${m.name}" entfernen?`)) return;
    await base44.entities.ImageModel.delete(m.id);
    load();
  };

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
          placeholder={source === "POLLINATIONS" ? "default (oder z. B. sana)" : "black-forest-labs/FLUX.1-schnell"}
          className={cn(inputCls, "mb-4")}
        />

        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Notiz (optional)</label>
        <input
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          placeholder="Wofür nimmst du es?"
          className={cn(inputCls, "mb-5")}
        />

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
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Deine Modelle ({models.length})
        </p>

        {models.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Noch keine Modelle hinterlegt — füge links dein erstes hinzu.
          </p>
        ) : (
          <div className="space-y-2">
            {models.map((m) => (
              <div key={m.id} className={cn("flex items-center gap-3 p-3 rounded-xl bg-elevated border border-border", !m.enabled && "opacity-60")}>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {(SOURCES.find((s) => s.value === m.source) || SOURCES[0]).label} · {m.modelId}
                  </p>
                  {m.note && <p className="text-[11px] text-muted-foreground truncate">{m.note}</p>}
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