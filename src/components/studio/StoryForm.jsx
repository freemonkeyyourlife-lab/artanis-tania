import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Save } from "lucide-react";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50";

export default function StoryForm({ initial, creators, onSaved, onCancel }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: initial?.title || "",
    creatorId: initial?.creatorId || creators?.[0]?.id || "",
    preview: initial?.preview || "",
    content: initial?.content || "",
    characters: (initial?.characters || []).join(", "),
    topics: (initial?.topics || []).join(", "),
    series: initial?.series || "",
    episode: initial?.episode ?? "",
    price: initial?.price ?? 0,
    published: initial?.published || false,
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.title.trim()) {
      toast({ title: "Titel fehlt", description: "Gib der Story einen Titel.", variant: "destructive" });
      return;
    }
    if (!form.creatorId) {
      toast({ title: "Kein Charakter vorhanden", description: "Lege zuerst im Tab Charaktere einen an.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const creator = creators?.find((c) => c.id === form.creatorId);
      const data = {
        title: form.title.trim(),
        creatorId: form.creatorId,
        creatorName: creator?.stageName || "",
        preview: form.preview,
        content: form.content,
        characters: form.characters.split(",").map((s) => s.trim()).filter(Boolean),
        topics: form.topics.split(",").map((s) => s.trim()).filter(Boolean),
        series: form.series,
        price: Number(form.price) || 0,
        published: form.published,
      };
      if (form.episode !== "" && form.episode !== null) data.episode = Number(form.episode);
      if (initial?.id) await base44.entities.Story.update(initial.id, data);
      else await base44.entities.Story.create(data);
      toast({ title: initial?.id ? "Story gespeichert" : "Story erstellt" });
      onSaved?.();
    } catch (e) {
      toast({ title: "Fehler", description: "Konnte nicht speichern.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-primary/30 bg-card p-6">
      <h2 className="font-display text-xl text-foreground mb-5">
        {initial?.id ? `"${initial.title}" bearbeiten` : "Neue Story anlegen"}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="text-xs text-muted-foreground mb-1.5 block">Titel</label>
          <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="z. B. Die Nacht im Motel" className={inputCls} />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Erzählt von</label>
          <select value={form.creatorId} onChange={(e) => set("creatorId", e.target.value)} className={inputCls}>
            {(creators || []).map((c) => (
              <option key={c.id} value={c.id}>{c.stageName}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Serie (optional)</label>
          <input value={form.series} onChange={(e) => set("series", e.target.value)} placeholder="z. B. Sommernächte" className={inputCls} />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs text-muted-foreground mb-1.5 block">Teaser (kurz, was den Leser anzieht)</label>
          <textarea value={form.preview} onChange={(e) => set("preview", e.target.value)} rows={3} placeholder="Ein Satz, der neugierig macht …" className={cn(inputCls, "resize-none")} />
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs text-muted-foreground mb-1.5 block">Story-Text</label>
          <textarea value={form.content} onChange={(e) => set("content", e.target.value)} rows={10} placeholder="Schreib die Story in deiner Stimme …" className={cn(inputCls, "resize-none")} />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Figuren (Komma-getrennt)</label>
          <input value={form.characters} onChange={(e) => set("characters", e.target.value)} placeholder="Triania, Jessie" className={inputCls} />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Themen (Komma-getrennt)</label>
          <input value={form.topics} onChange={(e) => set("topics", e.target.value)} placeholder="Exhibitionismus, Macht" className={inputCls} />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Preis (€, 0 = gratis)</label>
          <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} className={inputCls} />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Folge (optional)</label>
          <input type="number" min="1" value={form.episode} onChange={(e) => set("episode", e.target.value)} placeholder="z. B. 1" className={inputCls} />
        </div>

        <div className="sm:col-span-2 flex items-center gap-2">
          <input id="story-published" type="checkbox" checked={form.published} onChange={(e) => set("published", e.target.checked)} className="w-4 h-4 accent-primary" />
          <label htmlFor="story-published" className="text-sm text-muted-foreground">Veröffentlichen (im Chat verfügbar)</label>
        </div>
      </div>

      <div className="flex gap-3 mt-6">
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? "Speichert …" : "Speichern"}
        </button>
        <button onClick={onCancel} className="px-5 py-2.5 rounded-full bg-elevated border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
          Abbrechen
        </button>
      </div>
    </div>
  );
}