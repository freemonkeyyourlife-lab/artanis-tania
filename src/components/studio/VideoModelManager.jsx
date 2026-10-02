import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Loader2, Plus, Check, Power, Trash2, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import ModelKindTag from "@/components/studio/ModelKindTag";
import ModelTags from "@/components/studio/ModelTags";
import ModelFilterBar from "@/components/studio/ModelFilterBar";
import { matchesFilter } from "@/lib/modelTags";

const inputCls =
  "w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50";

const short = (n) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(n));

// Videomodelle — getrennt von Bild und Text, mit eigener Massen-Übernahme.
export default function VideoModelManager() {
  const { toast } = useToast();
  const [models, setModels] = useState([]);
  const [results, setResults] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(null);
  const [filter, setFilter] = useState({ style: "", explicit: "", moods: [] });

  useEffect(() => { load(); search(""); }, []);

  const load = async () => {
    try { setModels(await base44.entities.VideoModel.list("created_date")); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const search = async (q = "") => {
    setBusy(true);
    try {
      const res = await base44.functions.invoke("hfModels", { query: q, kind: "video" });
      if (res.data?.error) throw new Error(res.data.error);
      setResults(res.data.models || []);
    } catch (e) {
      toast({ title: "Suche hat nicht geklappt", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const taken = models.map((m) => m.modelId);
  const fresh = results.filter((m) => !taken.includes(m.id));

  const add = async (m) => {
    setAdding(m.id);
    try {
      await base44.entities.VideoModel.create({
        name: m.id.split("/").pop(),
        modelId: m.id,
        note: `Läuft über ${m.providers.join(", ")}`,
        enabled: true,
      });
      await load();
      toast({ title: "Übernommen", description: "Steht jetzt in deiner Video-Liste." });
    } catch (e) {
      toast({ title: "Konnte nicht speichern", variant: "destructive" });
    } finally {
      setAdding(null);
    }
  };

  // Alle auf einmal: hier steht nur, was bei Hugging Face einen laufenden Anbieter hat.
  const importAll = async () => {
    if (!fresh.length) return;
    setBusy(true);
    try {
      await base44.entities.VideoModel.bulkCreate(
        fresh.map((m) => ({
          name: m.id.split("/").pop(),
          modelId: m.id,
          note: `Läuft über ${m.providers.join(", ")}`,
          enabled: true,
        }))
      );
      await load();
      toast({ title: `${fresh.length} Video-Modelle übernommen`, description: "Alle mit aktivem Anbieter." });
    } catch (e) {
      toast({ title: "Konnte nicht übernehmen", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const toggle = async (m) => {
    await base44.entities.VideoModel.update(m.id, { enabled: !m.enabled });
    load();
  };

  // Kategorien direkt am Modell festhalten — Stil, Freizügigkeit, Stimmung.
  const saveTags = async (m, next) => {
    await base44.entities.VideoModel.update(m.id, next);
    load();
  };

  const remove = async (m) => {
    if (!window.confirm(`"${m.name}" entfernen?`)) return;
    await base44.entities.VideoModel.delete(m.id);
    load();
  };

  const visible = models.filter((m) => matchesFilter(m, filter));

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
        <ModelKindTag kind="VIDEO" className="mb-3" />
        <h2 className="font-display text-xl text-foreground mb-1">Videomodelle bei Hugging Face</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Gezeigt wird nur, was dort einen laufenden Anbieter hat. Beim Übernehmen wird geprüft, ob ein Anbieter
          aktiv ist — ein echtes Testvideo würde bei jedem Modell eine Minute dauern und dauert daher nur auf Klick.
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search(query)}
            placeholder="z. B. wan, hunyuan, ltx"
            className={cn(inputCls, "flex-1 min-w-[220px]")}
          />
          <button
            onClick={() => search(query)}
            disabled={busy}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 whitespace-nowrap"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Suchen
          </button>
          <button
            onClick={importAll}
            disabled={busy || fresh.length === 0}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 whitespace-nowrap"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Alle übernehmen ({fresh.length})
          </button>
        </div>

        {results.length === 0 && !busy && (
          <p className="text-sm text-muted-foreground py-6 text-center">Nichts gefunden — versuch einen anderen Begriff.</p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {results.map((m) => {
            const have = taken.includes(m.id);
            return (
              <div key={m.id} className="p-3 rounded-xl bg-elevated border border-border flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground truncate">{m.id}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {short(m.downloads)} Downloads · über {m.providers.slice(0, 2).join(", ")}
                  </p>
                </div>
                <button
                  onClick={() => add(m)}
                  disabled={have || adding === m.id}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors",
                    have ? "bg-emerald-600/20 text-emerald-400" : "bg-primary text-primary-foreground disabled:opacity-50"
                  )}
                >
                  {adding === m.id ? <Loader2 className="w-3 h-3 animate-spin" /> : have ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  {adding === m.id ? "Lädt …" : have ? "Drin" : "Übernehmen"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Deine Video-Modelle ({visible.length} von {models.length})
        </p>

        <ModelFilterBar kind="VIDEO" models={models} value={filter} onChange={setFilter} />

        {models.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Noch keine Video-Modelle — nimm oben welche dazu.
          </p>
        ) : visible.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Kein Modell passt zu dieser Kategorie — setz den Filter zurück.
          </p>
        ) : (
          <div className="space-y-2">
            {visible.map((m) => (
              <div key={m.id} className={cn("flex items-center gap-3 p-3 rounded-xl bg-elevated border border-border", !m.enabled && "opacity-60")}>
                <Check className="w-4 h-4 text-violet-300 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{m.modelId}{m.note ? ` · ${m.note}` : ""}</p>
                  <ModelTags kind="VIDEO" model={m} editable className="mt-1.5" onSave={(t) => saveTags(m, t)} />
                </div>
                <button
                  onClick={() => toggle(m)}
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