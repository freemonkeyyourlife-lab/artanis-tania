import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Hash, Loader2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { cleanTag, tagLabel } from "@/lib/hashtags";

const KINDS = ["ALLGEMEIN", "FIGUR", "BILD", "VIDEO", "TEXT", "STORY"];
const KIND_LABEL = {
  ALLGEMEIN: "Alles",
  FIGUR: "Figur",
  BILD: "Bild",
  VIDEO: "Video",
  TEXT: "Text",
  STORY: "Story",
};

const inputCls =
  "w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50";
const labelCls = "text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 block";

const rows = (res) => (Array.isArray(res) ? res : res?.items || []);

// Die feste Liste: jedes Wort genau einmal, mit seiner Bedeutung. Von hier
// nehmen Figuren, Material und Prompts ihre Hashtags.
export default function HashtagManager() {
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ name: "", meaning: "", kind: "ALLGEMEIN" });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setItems(rows(await base44.entities.Hashtag.filter({}, { sort: "order", limit: 200 })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const add = async () => {
    const name = cleanTag(form.name);
    if (!name || !form.meaning.trim()) return;
    if (items.some((i) => cleanTag(i.name) === name)) {
      toast({ title: "Gibt es schon", description: `${tagLabel(name)} steht bereits in der Liste.`, variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      await base44.entities.Hashtag.create({
        name,
        meaning: form.meaning.trim(),
        kind: form.kind,
        order: items.length + 1,
        active: true,
      });
      setForm({ name: "", meaning: "", kind: form.kind });
      await load();
      toast({ title: "Aufgenommen", description: `${tagLabel(name)} gilt ab jetzt überall gleich.` });
    } finally {
      setBusy(false);
    }
  };

  const saveMeaning = async (rec, meaning) => {
    if (meaning.trim() === (rec.meaning || "").trim()) return;
    await base44.entities.Hashtag.update(rec.id, { meaning: meaning.trim() });
    await load();
  };

  const toggle = async (rec) => {
    await base44.entities.Hashtag.update(rec.id, { active: rec.active === false });
    await load();
  };

  const remove = async (rec) => {
    await base44.entities.Hashtag.delete(rec.id);
    await load();
  };

  return (
    <div className="glass rounded-2xl border-2 border-border p-5">
      <p className="font-display text-2xl text-foreground flex items-center gap-2 mb-1">
        <Hash className="w-6 h-6 text-primary" /> Unsere Hashtags
      </p>
      <p className="text-[14px] font-semibold text-muted-foreground max-w-3xl mb-4 leading-relaxed">
        Ein Wort, eine Bedeutung. Was hier steht, hängt an Figuren und Material dran und läuft bei jedem Prompt mit —
        damit bei „freizügig" beide Seiten genau dasselbe meinen.
      </p>

      {loading ? (
        <p className="flex items-center gap-2 text-[13px] font-semibold text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Wird geladen …
        </p>
      ) : (
        <div className="space-y-2 mb-5">
          {items.map((h) => (
            <div key={h.id} className="rounded-xl border-2 border-border bg-background p-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[14px] font-bold text-foreground">{tagLabel(h.name)}</span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-primary">
                  {KIND_LABEL[h.kind] || "Alles"}
                </span>
                <button
                  onClick={() => toggle(h)}
                  className={cn(
                    "px-3 py-1 rounded-full text-[11px] font-bold ml-auto",
                    h.active !== false ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground"
                  )}
                >
                  {h.active !== false ? "Gilt" : "Aus"}
                </button>
                <button
                  onClick={() => remove(h)}
                  className="w-8 h-8 rounded-full bg-destructive/15 text-destructive flex items-center justify-center"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <textarea
                defaultValue={h.meaning}
                onBlur={(e) => saveMeaning(h, e.target.value)}
                rows={2}
                className={cn(inputCls, "resize-none mt-2")}
              />
            </div>
          ))}
          {!items.length && (
            <p className="text-[13px] font-semibold text-muted-foreground">
              Noch kein Wort drin — fang mit dem an, das dir am häufigsten erklärt werden muss.
            </p>
          )}
        </div>
      )}

      <div className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Welches Wort</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="z. B. freizügig"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Wofür</label>
            <div className="flex flex-wrap gap-1.5">
              {KINDS.map((k) => (
                <button
                  key={k}
                  onClick={() => setForm({ ...form, kind: k })}
                  className={cn(
                    "px-3 py-1.5 rounded-full border text-[11px] font-bold transition-colors",
                    form.kind === k
                      ? "bg-primary text-primary-foreground border-transparent"
                      : "bg-background border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {KIND_LABEL[k]}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <label className={labelCls}>Was heißt es genau</label>
          <textarea
            value={form.meaning}
            onChange={(e) => setForm({ ...form, meaning: e.target.value })}
            rows={3}
            placeholder="Sag es in deinen Worten — so, wie du es mir sonst erklärst."
            className={cn(inputCls, "resize-none")}
          />
        </div>
        <button
          onClick={add}
          disabled={busy || !form.name.trim() || !form.meaning.trim()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn glass-btn-accent text-[14px] font-bold disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Wort aufnehmen
        </button>
      </div>
    </div>
  );
}