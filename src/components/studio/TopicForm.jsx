import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Save } from "lucide-react";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50";

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[äÄ]/g, "ae").replace(/[öÖ]/g, "oe").replace(/[üÜ]/g, "ue").replace(/ß/g, "ss").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export default function TopicForm({ initial, onSaved, onCancel }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: initial?.name || "",
    description: initial?.description || "",
    category: initial?.category || "",
    icon: initial?.icon || "",
    enabled: initial?.enabled ?? true,
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.name.trim()) {
      toast({ title: "Name fehlt", description: "Gib dem Thema einen Namen.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const data = {
        name: form.name.trim(),
        slug: slugify(form.name),
        description: form.description,
        category: form.category,
        icon: form.icon,
        enabled: form.enabled,
      };
      if (initial?.id) await base44.entities.Topic.update(initial.id, data);
      else await base44.entities.Topic.create(data);
      toast({ title: initial?.id ? "Thema gespeichert" : "Thema erstellt" });
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
        {initial?.id ? `"${initial.name}" bearbeiten` : "Neues Thema anlegen"}
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Name</label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="z. B. Exhibitionismus" className={inputCls} />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Kategorie (optional)</label>
          <input value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="z. B. Fetische" className={inputCls} />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Icon (Emoji, optional)</label>
          <input value={form.icon} onChange={(e) => set("icon", e.target.value)} placeholder="🔥" className={inputCls} />
        </div>

        <div className="flex items-end pb-1">
          <div className="flex items-center gap-2">
            <input id="topic-enabled" type="checkbox" checked={form.enabled} onChange={(e) => set("enabled", e.target.checked)} className="w-4 h-4 accent-primary" />
            <label htmlFor="topic-enabled" className="text-sm text-muted-foreground">Aktiv</label>
          </div>
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs text-muted-foreground mb-1.5 block">Beschreibung</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="Worum geht es in diesem Thema?" className={cn(inputCls, "resize-none")} />
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