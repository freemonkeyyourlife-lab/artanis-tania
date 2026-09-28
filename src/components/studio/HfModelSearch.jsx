import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, Loader2, Plus, Check } from "lucide-react";
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

  const add = async (m) => {
    setAdding(m.id);
    try {
      await base44.entities.ImageModel.create({
        name: m.id.split("/").pop(),
        modelId: m.id,
        source: "HUGGING_FACE",
        note: m.providers.length ? `Läuft über ${m.providers.join(", ")}` : "Nur über Hugging-Face-Server",
        enabled: true,
      });
      toast({ title: "Übernommen", description: "Im Generator ist es jetzt als Quelle wählbar." });
      onAdded?.();
    } catch (e) {
      toast({ title: "Konnte nicht speichern", variant: "destructive" });
    } finally {
      setAdding(null);
    }
  };

  return (
    <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-5">
      <h2 className="font-display text-xl text-foreground mb-1">Bei Hugging Face suchen</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Bildmodelle nach Beliebtheit. Was du übernimmst, steht danach im Generator unter „Quelle“.
      </p>

      <div className="flex gap-2 mb-4">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search(query)}
          placeholder="z. B. flux, sdxl, realistic"
          className={inputCls}
        />
        <button
          onClick={() => search(query)}
          disabled={busy}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 whitespace-nowrap"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Suchen
        </button>
      </div>

      {results.length === 0 && !busy && (
        <p className="text-sm text-muted-foreground py-6 text-center">Nichts gefunden — versuch einen anderen Begriff.</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {results.map((m) => {
          const have = existingIds.includes(m.id);
          return (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-elevated border border-border">
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground truncate">{m.id}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {short(m.downloads)} Downloads
                  {m.providers.length ? ` · über ${m.providers.slice(0, 2).join(", ")}` : " · nur Hugging-Face-Server"}
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
                {have ? "Drin" : "Übernehmen"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}