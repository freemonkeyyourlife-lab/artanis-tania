import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Loader2, Plus, Check, Power, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50";

// Text-Modelle: welche über das Hugging-Face-Konto laufen, sind im Chat wählbar.
export default function TextModelManager() {
  const { toast } = useToast();
  const [models, setModels] = useState([]);
  const [available, setAvailable] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(null);

  useEffect(() => { load(); search(); }, []);

  const load = async () => {
    try { setModels(await base44.entities.TextModel.list("created_date")); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // Die Liste kommt direkt aus dem Router — nur was dort steht, läuft wirklich.
  const search = async () => {
    setBusy(true);
    try {
      const res = await base44.functions.invoke("hfChat", { action: "models" });
      if (res.data?.error) throw new Error(res.data.error);
      setAvailable(res.data.models || []);
    } catch (e) {
      toast({ title: "Liste kam nicht an", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  // Kurzer Probelauf — nur Modelle, die wirklich antworten, werden übernommen.
  const add = async (m) => {
    setAdding(m.id);
    try {
      const test = await base44.functions.invoke("hfChat", { modelId: m.id, prompt: "Antworte mit genau einem Wort: Bereit." });
      if (test.data?.error) throw new Error(test.data.error);
      if (!test.data?.text) throw new Error("Keine Antwort erhalten.");
      await base44.entities.TextModel.create({
        name: m.id.split("/").pop(),
        modelId: m.id,
        note: m.provider ? `Läuft über ${m.provider}` : "",
        enabled: true,
      });
      await load();
      toast({ title: "Läuft — übernommen", description: "Im Chat jetzt als Modell wählbar." });
    } catch (e) {
      toast({ title: "Läuft nicht", description: e.message, variant: "destructive" });
    } finally {
      setAdding(null);
    }
  };

  const toggle = async (m) => {
    await base44.entities.TextModel.update(m.id, { enabled: !m.enabled });
    load();
  };

  const remove = async (m) => {
    if (!window.confirm(`"${m.name}" entfernen?`)) return;
    await base44.entities.TextModel.delete(m.id);
    load();
  };

  const taken = models.map((m) => m.modelId);
  const q = query.trim().toLowerCase();
  const results = available
    .filter((m) => !taken.includes(m.id))
    .filter((m) => !q || m.id.toLowerCase().includes(q))
    .slice(0, 24);

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-xl text-foreground mb-1">Text-Modelle bei Hugging Face</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Das sind die Modelle, die über dein verbundenes Konto wirklich antworten. Beim Übernehmen machen wir einen kurzen
          Probelauf — läuft es nicht, bleibt es draußen. Was drin ist, ist im Chat als Modell wählbar.
        </p>

        <div className="flex gap-2 mb-4">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suchen, z. B. qwen, deepseek, llama"
            className={inputCls}
          />
          <button
            onClick={search}
            disabled={busy}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 whitespace-nowrap"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Aktualisieren
          </button>
        </div>

        {results.length === 0 && !busy && (
          <p className="text-sm text-muted-foreground py-6 text-center">
            {available.length === 0 ? "Keine Modelle gemeldet." : "Nichts Neues gefunden."}
          </p>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {results.map((m) => (
            <div key={m.id} className="p-3 rounded-xl bg-elevated border border-border flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground truncate">{m.id}</p>
                {m.provider && <p className="text-[11px] text-muted-foreground truncate">über {m.provider}</p>}
              </div>
              <button
                onClick={() => add(m)}
                disabled={adding === m.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold whitespace-nowrap disabled:opacity-50"
              >
                {adding === m.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                {adding === m.id ? "Probiert …" : "Prüfen & übernehmen"}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Deine Text-Modelle ({models.length})
        </p>

        {models.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            Noch keine Modelle — nimm oben eines mit einem Klick dazu.
          </p>
        ) : (
          <div className="space-y-2">
            {models.map((m) => (
              <div key={m.id} className={cn("flex items-center gap-3 p-3 rounded-xl bg-elevated border border-border", !m.enabled && "opacity-60")}>
                <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{m.modelId}{m.note ? ` · ${m.note}` : ""}</p>
                </div>
                <button
                  onClick={() => toggle(m)}
                  title={m.enabled ? "Im Chat ausblenden" : "Im Chat anzeigen"}
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