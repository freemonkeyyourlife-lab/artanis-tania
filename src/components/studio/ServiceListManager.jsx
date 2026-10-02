import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ExternalLink, Plus, Trash2, Search, Star, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (e) {
    return url;
  }
};

// Die Sammlung fremder Dienste: Name und Adresse, ein Klick öffnet sie in einem
// neuen Tab. Nichts wird eingebettet — es geht immer der eigene Browser auf.
export default function ServiceListManager() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ name: "", url: "", category: "" });
  const [busy, setBusy] = useState(false);

  const load = async (search = "") => {
    setLoading(true);
    try {
      const res = search.trim()
        ? await base44.entities.ExternalService.filter(
            { name: { $regex: search.trim(), $options: "i" } },
            { sort: "name", limit: 200 }
          )
        : await base44.entities.ExternalService.list("name", 400);
      setServices(Array.isArray(res) ? res : res.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => load(query), query ? 350 : 0);
    return () => clearTimeout(timer);
  }, [query]);

  const add = async () => {
    if (!form.name.trim() || !form.url.trim()) return;
    setBusy(true);
    try {
      await base44.entities.ExternalService.create({
        name: form.name.trim(),
        url: form.url.trim(),
        category: form.category.trim(),
      });
      setForm({ name: "", url: "", category: "" });
      await load(query);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (s) => {
    if (!window.confirm(`„${s.name}" aus der Liste nehmen?`)) return;
    await base44.entities.ExternalService.delete(s.id);
    setServices((prev) => prev.filter((x) => x.id !== s.id));
  };

  const toggleFavorite = async (s) => {
    await base44.entities.ExternalService.update(s.id, { favorite: !s.favorite });
    setServices((prev) => prev.map((x) => (x.id === s.id ? { ...x, favorite: !x.favorite } : x)));
  };

  const sorted = [...services].sort(
    (a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0) || (a.name || "").localeCompare(b.name || "")
  );

  return (
    <div className="glass rounded-2xl border-2 border-border p-6">
      <p className="font-display text-2xl text-foreground mb-1">Dienste-Liste</p>
      <p className="text-[15px] font-semibold text-muted-foreground mb-5 max-w-2xl">
        Fremde Dienste mit Name und Adresse. Ein Klick öffnet sie in einem neuen Tab — nichts wird hier eingebettet.
      </p>

      <div className="rounded-2xl border border-border bg-card p-4 mb-5">
        <p className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Neuen Dienst eintragen</p>
        <div className="flex flex-wrap gap-2">
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Name"
            className="flex-1 min-w-[180px] h-11 text-[15px] font-semibold"
          />
          <Input
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="https://…"
            className="flex-[2] min-w-[240px] h-11 text-[15px] font-semibold"
          />
          <Input
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            placeholder="Gruppe (optional)"
            className="flex-1 min-w-[160px] h-11 text-[15px] font-semibold"
          />
          <button
            onClick={add}
            disabled={busy || !form.name.trim() || !form.url.trim()}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full glass-btn glass-btn-accent text-[15px] font-bold text-gloss disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Eintragen
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="In der Liste suchen"
            className="pl-9 h-11 text-[15px] font-semibold"
          />
        </div>
        <span className="text-[13px] font-bold text-muted-foreground">
          {loading ? "Lädt …" : `${services.length} ${services.length === 1 ? "Eintrag" : "Einträge"}`}
        </span>
      </div>

      {loading && services.length === 0 ? (
        <div className="flex justify-center py-14">
          <div className="w-7 h-7 border-4 border-border border-t-primary rounded-full animate-spin" />
        </div>
      ) : sorted.length === 0 ? (
        <p className="text-center py-14 text-[15px] font-semibold text-muted-foreground">
          {query ? "Nichts gefunden." : "Noch nichts drin — trag oben den ersten Dienst ein."}
        </p>
      ) : (
        <div className="space-y-2">
          {sorted.map((s) => (
            <div key={s.id} className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2.5">
              <button
                onClick={() => toggleFavorite(s)}
                title={s.favorite ? "Aus den Favoriten nehmen" : "Als Favorit merken"}
                className={cn("flex-shrink-0", s.favorite ? "text-primary" : "text-muted-foreground hover:text-foreground")}
              >
                <Star className={cn("w-4 h-4", s.favorite && "fill-current")} />
              </button>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-foreground truncate">{s.name}</p>
                <p className="text-[12px] font-semibold text-muted-foreground truncate">
                  {s.category ? `${s.category} · ` : ""}
                  {hostOf(s.url)}
                </p>
              </div>
              <a
                href={s.url}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full glass-btn text-[13px] font-bold text-foreground flex-shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Öffnen
              </a>
              <button
                onClick={() => remove(s)}
                title="Entfernen"
                className="w-9 h-9 rounded-full bg-destructive/15 text-destructive flex items-center justify-center flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}