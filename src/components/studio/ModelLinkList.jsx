import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { ExternalLink, Plus, Trash2, Search, Star, Loader2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const KINDS = ["BILD", "TEXT", "VIDEO", "AUDIO", "3D", "REALTIME", "EMBEDDING"];
const KIND_LABEL = {
  BILD: "Bildmodelle",
  TEXT: "Textmodelle",
  VIDEO: "Videomodelle",
  AUDIO: "Audio & Stimme",
  "3D": "3D-Modelle",
  REALTIME: "Echtzeit",
  EMBEDDING: "Embeddings",
};

const hostOf = (url) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (e) {
    return url;
  }
};

// Der Link zu einem Modell — nur wenn die Kennung wirklich ein Modellpfad ist.
const modelUrl = (source, modelId) => {
  const id = (modelId || "").trim();
  if (!id) return "";
  if (source === "POLLINATIONS") return "https://pollinations.ai";
  if (!/^[\w.-]+\/[\w.-]+$/.test(id)) return "";
  return `https://huggingface.co/${id}`;
};

// Nur die Modell-Links — getrennt von der Dienste-Liste.
export default function ModelLinkList() {
  const { toast } = useToast();
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ name: "", url: "", kind: "BILD", io: "" });

  const load = async (search = "") => {
    setLoading(true);
    try {
      const res = search.trim()
        ? await base44.entities.ModelLink.filter(
            { name: { $regex: search.trim(), $options: "i" } },
            { sort: "name", limit: 300 }
          )
        : await base44.entities.ModelLink.list("name", 500);
      setLinks(Array.isArray(res) ? res : res.items || []);
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
      await base44.entities.ModelLink.create({
        name: form.name.trim(),
        url: form.url.trim(),
        kind: form.kind,
        io: form.io.trim(),
      });
      setForm({ name: "", url: "", kind: form.kind, io: "" });
      await load(query);
    } finally {
      setBusy(false);
    }
  };

  // Ein Klick: alles aus den Modell-Listen holen, was hier noch fehlt.
  const fillFromModels = async () => {
    setBusy(true);
    try {
      const [imgs, txts] = await Promise.all([
        base44.entities.ImageModel.list("-created_date", 300),
        base44.entities.TextModel.list("-created_date", 300),
      ]);
      const existing = new Set(links.map((l) => l.url));
      const wanted = [
        ...(Array.isArray(imgs) ? imgs : imgs.items || []).map((m) => ({
          name: m.name,
          url: modelUrl(m.source, m.modelId),
          kind: "BILD",
          note: m.note,
        })),
        ...(Array.isArray(txts) ? txts : txts.items || []).map((m) => ({
          name: m.name,
          url: modelUrl("HUGGING_FACE", m.modelId),
          kind: "TEXT",
          note: m.note,
        })),
      ];
      const fresh = [];
      const seen = new Set();
      for (const w of wanted) {
        if (!w.url || existing.has(w.url) || seen.has(w.url)) continue;
        seen.add(w.url);
        fresh.push(w);
      }
      if (fresh.length) await base44.entities.ModelLink.bulkCreate(fresh);
      await load(query);
      toast({
        title: fresh.length ? `${fresh.length} neue Modell-Links übernommen` : "Nichts Neues dabei",
        description: fresh.length
          ? "Alle Modelle aus den Modell-Listen sind jetzt hier verlinkt."
          : "Alle Modelle aus den Modell-Listen stehen hier schon drin.",
      });
    } finally {
      setBusy(false);
    }
  };

  const remove = async (l) => {
    if (!window.confirm(`„${l.name}" aus der Sammlung nehmen?`)) return;
    await base44.entities.ModelLink.delete(l.id);
    setLinks((prev) => prev.filter((x) => x.id !== l.id));
  };

  const toggleFavorite = async (l) => {
    await base44.entities.ModelLink.update(l.id, { favorite: !l.favorite });
    setLinks((prev) => prev.map((x) => (x.id === l.id ? { ...x, favorite: !x.favorite } : x)));
  };

  const sorted = [...links].sort(
    (a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0) || (a.name || "").localeCompare(b.name || "")
  );
  const groups = KINDS.map((k) => ({ kind: k, items: sorted.filter((l) => (l.kind || "BILD") === k) })).filter(
    (g) => g.items.length
  );

  return (
    <div className="glass rounded-2xl border-2 border-border p-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <p className="font-display text-2xl text-foreground mb-1">Modell-Links</p>
          <p className="text-[15px] font-semibold text-muted-foreground max-w-2xl">
            Nur die Modelle, jeder mit seinem direkten Link. Ein Klick öffnet die Modellseite in einem neuen Tab — getrennt
            von der Dienste-Liste.
          </p>
        </div>
        <button
          onClick={fillFromModels}
          disabled={busy}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[14px] font-bold text-foreground disabled:opacity-50 whitespace-nowrap"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Aus den Modell-Listen übernehmen
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-4 mb-5">
        <p className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Modell-Link eintragen</p>
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
            placeholder="https://huggingface.co/…"
            className="flex-[2] min-w-[240px] h-11 text-[15px] font-semibold"
          />
          <Input
            value={form.io}
            onChange={(e) => setForm({ ...form, io: e.target.value })}
            placeholder="Typ, z. B. Bild → Video"
            className="flex-1 min-w-[180px] h-11 text-[15px] font-semibold"
          />
          <div className="flex gap-1.5">
            {KINDS.map((k) => (
              <button
                key={k}
                onClick={() => setForm({ ...form, kind: k })}
                className={cn(
                  "px-4 h-11 rounded-full text-[14px] font-bold transition-colors",
                  form.kind === k ? "glass-btn glass-btn-accent text-gloss" : "glass-btn text-muted-foreground"
                )}
              >
                {KIND_LABEL[k]}
              </button>
            ))}
          </div>
          <button
            onClick={add}
            disabled={busy || !form.name.trim() || !form.url.trim()}
            className="inline-flex items-center gap-2 px-6 h-11 rounded-full bg-primary text-primary-foreground text-[15px] font-bold disabled:opacity-50"
          >
            <Plus className="w-4 h-4" /> Hinzufügen
          </button>
        </div>
      </div>

      <div className="relative mb-5 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Modell suchen…"
          className="pl-9 h-11 text-[15px] font-semibold"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-14">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : links.length === 0 ? (
        <p className="text-[15px] font-semibold text-muted-foreground text-center py-14">
          Noch keine Modell-Links — hol sie mit einem Klick aus deinen Modell-Listen.
        </p>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <div key={g.kind}>
              <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                {KIND_LABEL[g.kind]} · {g.items.length}
              </p>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {g.items.map((l) => (
                  <div key={l.id} className="rounded-2xl border border-border bg-card p-3.5 flex items-start gap-3">
                    <a
                      href={l.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 min-w-0 group"
                      title={l.url}
                    >
                      <p className="text-[15px] font-bold text-foreground truncate group-hover:text-primary transition-colors">
                        {l.name}
                      </p>
                      <p className="text-[12px] font-semibold text-muted-foreground truncate flex items-center gap-1.5 mt-0.5">
                        <ExternalLink className="w-3 h-3 flex-shrink-0" /> {hostOf(l.url)}
                      </p>
                      {l.io && (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-primary/15 text-primary text-[11px] font-bold mt-1.5">
                          {l.io}
                        </span>
                      )}
                      {l.note && (
                        <p className="text-[12px] font-semibold text-muted-foreground/80 line-clamp-2 mt-1">{l.note}</p>
                      )}
                    </a>
                    <button
                      onClick={() => toggleFavorite(l)}
                      title="Oben anpinnen"
                      className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                        l.favorite ? "bg-primary/25 text-primary" : "bg-elevated border border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Star className={cn("w-4 h-4", l.favorite && "fill-current")} />
                    </button>
                    <button
                      onClick={() => remove(l)}
                      title="Aus der Sammlung nehmen"
                      className="w-9 h-9 rounded-full bg-destructive/15 text-destructive flex items-center justify-center flex-shrink-0 hover:bg-destructive/25 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}