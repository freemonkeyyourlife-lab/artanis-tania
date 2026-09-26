import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Check } from "lucide-react";

const VISIBILITIES = ["PUBLIC", "REGISTERED", "FREE_MEMBER", "VIP", "PPV", "PRIVATE", "UNLISTED"];

export default function ContentManager() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try { setItems(await base44.entities.Content.list("-created_date", 100)); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
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

  if (items.length === 0) {
    return <p className="text-muted-foreground text-center py-16">Noch keine Inhalte — leg welche an, dann kannst du hier Preise setzen.</p>;
  }

  return (
    <div className="space-y-3">
      <p className="text-muted-foreground text-xs mb-1">Preis und Sichtbarkeit jederzeit ändern — 0 € heißt gratis.</p>
      {items.map((item) => (
        <div key={item.id} className="rounded-2xl border border-border bg-card p-4 flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{item.title}</p>
            <p className="text-xs text-muted-foreground">{(item.contentType || "").replace(/_/g, " ").toLowerCase()}</p>
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