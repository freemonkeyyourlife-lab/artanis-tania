import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Loader2, Plus, Check, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50";

const short = (n) => (n >= 1000 ? `${Math.round(n / 1000)}k` : String(n));

// Modelle direkt bei Hugging Face suchen und mit einem Klick übernehmen.
export default function HfModelSearch({ existingIds = [], onAdded, onAccount }) {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(null);
  const [failed, setFailed] = useState({});
  const [bulk, setBulk] = useState(null); // { total, done, ok, fail, current }
  const bulkStop = useRef(false);

  const search = async (q = "") => {
    setBusy(true);
    try {
      const res = await base44.functions.invoke("hfModels", { query: q });
      if (res.data?.error) throw new Error(res.data.error);
      setResults(res.data.models || []);
      onAccount?.(res.data.account || null);
    } catch (e) {
      toast({ title: "Suche hat nicht geklappt", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => { search(""); }, []);

  // Kurzer Probelauf: nur Modelle, die wirklich ein Bild liefern, werden übernommen.
  const add = async (m) => {
    setAdding(m.id);
    setFailed((f) => ({ ...f, [m.id]: null }));
    try {
      const res = await base44.functions.invoke("hfGenerate", {
        modelId: m.id,
        source: "HUGGING_FACE",
        prompt: "portrait photo of a woman, soft natural light, plain background",
      });
      if (res.data?.error) throw new Error(res.data.error);

      await base44.entities.ImageModel.create({
        name: m.id.split("/").pop(),
        modelId: m.id,
        source: "HUGGING_FACE",
        note: `Läuft über ${m.providers.join(", ")}`,
        enabled: true,
      });
      toast({ title: "Läuft — übernommen", description: "Im Generator ist es jetzt als Quelle wählbar." });
      onAdded?.();
    } catch (e) {
      setFailed((f) => ({ ...f, [m.id]: e.message || "Hat kein Bild geliefert." }));
    } finally {
      setAdding(null);
    }
  };

  // Alle auf einmal: jedes Modell kurz probieren, die laufenden übernehmen.
  const importAll = async () => {
    const todo = results.filter((m) => !existingIds.includes(m.id));
    if (!todo.length) return;
    bulkStop.current = false;
    setBulk({ total: todo.length, done: 0, ok: 0, fail: 0, current: "" });
    const passed = [];
    let ok = 0;
    let fail = 0;
    for (const m of todo) {
      if (bulkStop.current) break;
      setBulk((b) => ({ ...b, current: m.id }));
      try {
        const res = await base44.functions.invoke("hfGenerate", {
          modelId: m.id,
          source: "HUGGING_FACE",
          prompt: "portrait photo of a woman, soft natural light, plain background",
        });
        if (res.data?.error) throw new Error(res.data.error);
        passed.push(m);
        ok += 1;
      } catch (e) {
        fail += 1;
        setFailed((f) => ({ ...f, [m.id]: e.message || "Hat kein Bild geliefert." }));
      }
      setBulk((b) => ({ ...b, done: b.done + 1, ok, fail }));
    }

    if (passed.length) {
      await base44.entities.ImageModel.bulkCreate(
        passed.map((m) => ({
          name: m.id.split("/").pop(),
          modelId: m.id,
          source: "HUGGING_FACE",
          note: `Läuft über ${m.providers.join(", ")}`,
          enabled: true,
        }))
      );
    }
    onAdded?.();
    setBulk(null);
    toast({
      title: `${ok} übernommen`,
      description: fail ? `${fail} liefen nicht und blieben draußen.` : "Alle haben ein Bild geliefert.",
    });
  };

  return (
    <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
      <h2 className="font-display text-xl text-foreground mb-1">Bei Hugging Face suchen</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Nur Modelle mit aktivem Anbieter. Beim Übernehmen machen wir einen kurzen Probelauf — läuft es nicht, bleibt es draußen. Was drin ist, steht im Generator unter „Quelle“.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search(query)}
          placeholder="z. B. flux, sdxl, realistic"
          className={cn(inputCls, "flex-1 min-w-[220px]")}
        />
        <button
          onClick={() => search(query)}
          disabled={busy || !!bulk}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 whitespace-nowrap"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Suchen
        </button>
        <button
          onClick={importAll}
          disabled={busy || !!bulk || results.length === 0}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 whitespace-nowrap"
        >
          {bulk ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Alle prüfen &amp; übernehmen
        </button>
      </div>

      {bulk && (
        <div className="mb-4 rounded-xl border border-primary/30 bg-elevated p-4">
          <p className="text-sm text-foreground">
            Läuft … {bulk.done} / {bulk.total} geprüft — {bulk.ok} laufen, {bulk.fail} nicht
          </p>
          {bulk.current && <p className="text-[11px] text-muted-foreground mt-1 truncate">Gerade dran: {bulk.current}</p>}
          <button
            onClick={() => { bulkStop.current = true; }}
            className="mt-3 px-4 py-1.5 rounded-full bg-background border border-border text-[11px] font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            Stoppen
          </button>
        </div>
      )}

      {results.length === 0 && !busy && (
        <p className="text-sm text-muted-foreground py-6 text-center">Nichts gefunden — versuch einen anderen Begriff.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {results.map((m) => {
          const have = existingIds.includes(m.id);
          const error = failed[m.id];
          return (
            <div key={m.id} className="p-3 rounded-xl bg-elevated border border-border">
              <div className="flex items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground truncate">{m.id}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {short(m.downloads)} Downloads · über {m.providers.slice(0, 2).join(", ")}
                  </p>
                </div>
                <button
                  onClick={() => add(m)}
                  disabled={have || adding === m.id}
                  title={have ? "Ist schon drin" : "Kurz prüfen und übernehmen"}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors",
                    have ? "bg-emerald-600/20 text-emerald-400" : "bg-primary text-primary-foreground disabled:opacity-50"
                  )}
                >
                  {adding === m.id ? <Loader2 className="w-3 h-3 animate-spin" /> : have ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                  {adding === m.id ? "Probiert …" : have ? "Drin" : "Prüfen & übernehmen"}
                </button>
              </div>
              {error && <p className="text-[11px] text-destructive mt-2">Läuft nicht: {error}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
}