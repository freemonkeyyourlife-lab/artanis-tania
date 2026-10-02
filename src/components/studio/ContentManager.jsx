import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Check } from "lucide-react";
import ContentUploadForm from "@/components/studio/ContentUploadForm";
import HashtagPicker from "@/components/studio/HashtagPicker";
import { loadHashtags, tagLabel } from "@/lib/hashtags";

const VISIBILITIES = ["PUBLIC", "REGISTERED", "FREE_MEMBER", "VIP", "PPV", "PRIVATE", "UNLISTED"];

export default function ContentManager({ creators = [] }) {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [hashtags, setHashtags] = useState([]);
  const [tagFilter, setTagFilter] = useState("");

  useEffect(() => { load(); }, []);
  useEffect(() => { loadHashtags().then(setHashtags).catch(() => {}); }, []);

  // Nach Hashtag wird auf dem Server gesucht — so findet man Material wieder,
  // auch wenn inzwischen viel dazugekommen ist.
  const load = async (tag = "") => {
    try {
      const page = await base44.entities.Content.filter(
        tag ? { hashtags: tag } : {},
        { sort: "-created_date", limit: 100 }
      );
      setItems(page.items || []);
    }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const pickFilter = (tag) => {
    const next = tagFilter === tag ? "" : tag;
    setTagFilter(next);
    setLoading(true);
    load(next);
  };

  const patch = (id, key, value) =>
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, [key]: value } : i)));

  const save = async (item) => {
    setSavingId(item.id);
    try {
      await base44.entities.Content.update(item.id, {
        price: Number(item.price) || 0,
        isFree: (Number(item.price) || 0) === 0,
        published: !!item.published,
        visibility: item.visibility,
        hashtags: item.hashtags || [],
      });
      toast({ title: "Gespeichert", description: `"${item.title}" aktualisiert.` });
    } catch (e) {
      toast({ title: "Fehler", description: "Konnte nicht speichern.", variant: "destructive" });
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-3">
      <ContentUploadForm creators={creators} onCreated={load} />
      {hashtags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Nach Hashtag suchen:</span>
          {hashtags.map((h) => (
            <button
              key={h.id}
              onClick={() => pickFilter(h.name)}
              title={h.meaning}
              className={`px-3 py-1.5 rounded-full border text-[11px] font-bold transition-colors ${
                tagFilter === h.name
                  ? "bg-primary text-primary-foreground border-transparent"
                  : "bg-background border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {tagLabel(h.name)}
            </button>
          ))}
          {tagFilter && (
            <button onClick={() => pickFilter(tagFilter)} className="text-[11px] font-bold text-primary underline">
              Filter weg
            </button>
          )}
        </div>
      )}
      {items.length === 0 && (
        <p className="text-muted-foreground text-center py-10">Noch keine Inhalte — lade oben deinen ersten hoch.</p>
      )}
      {items.length > 0 && (
        <p className="text-muted-foreground text-xs mb-1">Preis und Sichtbarkeit jederzeit ändern — 0 € heißt gratis.</p>
      )}
      {items.map((item) => (
        <div key={item.id} className="rounded-2xl border border-border bg-card p-4 flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
            <p className="text-xs text-muted-foreground">{(item.contentType || "").replace(/_/g, " ").toLowerCase()}</p>
          </div>
          <div className="lg:w-80 flex-shrink-0">
            <HashtagPicker
              label="Hashtags"
              options={hashtags}
              value={item.hashtags || []}
              onChange={(v) => patch(item.id, "hashtags", v)}
            />
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-muted-foreground">Preis €</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={item.price ?? 0}
                onChange={(e) => patch(item.id, "price", e.target.value)}
                className="w-24 px-3 py-2 rounded-xl bg-elevated border border-border text-sm text-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
            <select
              value={item.visibility || "PUBLIC"}
              onChange={(e) => patch(item.id, "visibility", e.target.value)}
              className="px-3 py-2 rounded-xl bg-elevated border border-border text-xs text-foreground focus:outline-none focus:border-primary/50"
            >
              {VISIBILITIES.map((v) => <option key={v} value={v}>{v.replace(/_/g, " ")}</option>)}
            </select>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <input type="checkbox" checked={!!item.published} onChange={(e) => patch(item.id, "published", e.target.checked)} className="w-4 h-4 accent-primary" /> live
            </label>
            <button
              onClick={() => save(item)}
              disabled={savingId === item.id}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" /> {savingId === item.id ? "…" : "Speichern"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}