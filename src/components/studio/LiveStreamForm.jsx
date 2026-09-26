import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Save, X, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";

const inputCls = "w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 appearance-none";

const PLATFORMS = [
  { value: "STRIPCHAT", label: "Stripchat" },
  { value: "CHATURBATE", label: "Chaturbate" },
  { value: "CAM4", label: "CAM4" },
  { value: "BONGACAMS", label: "BongaCams" },
  { value: "MYFREECAMS", label: "MyFreeCams" },
  { value: "ANDERE", label: "Andere Plattform" },
];

const STATUSES = [
  { value: "OFFLINE", label: "Offline" },
  { value: "SCHEDULED", label: "Geplant" },
  { value: "LIVE", label: "Live" },
  { value: "ENDED", label: "Beendet" },
];

export default function LiveStreamForm({ initial, onSaved, onCancel }) {
  const [form, setForm] = useState({
    title: initial?.title || "",
    platform: initial?.platform || "STRIPCHAT",
    roomUrl: initial?.roomUrl || "",
    embedUrl: initial?.embedUrl || "",
    status: initial?.status || "OFFLINE",
    startsAt: initial?.startsAt ? initial.startsAt.slice(0, 16) : "",
    description: initial?.description || "",
    thumbnail: initial?.thumbnail || "",
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const uploadThumb = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await base44.integrations.Core.UploadPublicFile({ file });
      set("thumbnail", res.file_url);
    } catch (err) {
      console.error(err);
      toast({ title: "Upload fehlgeschlagen", variant: "destructive" });
    }
    e.target.value = "";
  };

  const save = async () => {
    if (!form.title.trim()) {
      toast({ title: "Titel fehlt", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      };
      if (initial?.id) await base44.entities.LiveStream.update(initial.id, payload);
      else await base44.entities.LiveStream.create(payload);
      toast({ title: initial?.id ? "Gespeichert" : "Live-Stream angelegt" });
      onSaved();
    } catch (err) {
      console.error(err);
      toast({ title: "Fehler beim Speichern", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="font-display text-lg text-foreground mb-4">{initial?.id ? "Live-Stream bearbeiten" : "Neuer Live-Stream"}</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="text-xs text-muted-foreground mb-1.5 block">Titel</label>
          <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="z. B. Live auf Stripchat — heute Nacht" className={inputCls} />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Plattform</label>
          <select value={form.platform} onChange={(e) => set("platform", e.target.value)} className={inputCls}>
            {PLATFORMS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Status</label>
          <select value={form.status} onChange={(e) => set("status", e.target.value)} className={inputCls}>
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs text-muted-foreground mb-1.5 block">Link zu deinem Raum</label>
          <input value={form.roomUrl} onChange={(e) => set("roomUrl", e.target.value)} placeholder="https://stripchat.com/dein-name" className={inputCls} />
          <p className="text-[11px] text-muted-foreground mt-1">Dorthin führt der Button „Zuschauen".</p>
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs text-muted-foreground mb-1.5 block">Embed-Link (optional)</label>
          <input value={form.embedUrl} onChange={(e) => set("embedUrl", e.target.value)} placeholder="https://… (nur wenn die Plattform einen einbettbaren Player gibt)" className={inputCls} />
          <p className="text-[11px] text-muted-foreground mt-1">Nur nötig, wenn der Stream direkt in der App laufen soll. Ohne Embed erscheint Vorschaubild + Button.</p>
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Beginnt am (optional)</label>
          <input type="datetime-local" value={form.startsAt} onChange={(e) => set("startsAt", e.target.value)} className={inputCls} />
        </div>

        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Vorschaubild</label>
          {form.thumbnail ? (
            <div className="relative w-full aspect-video rounded-xl overflow-hidden">
              <Image src={form.thumbnail} fittingType="fill" className="w-full h-full" />
              <button onClick={() => set("thumbnail", "")} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-destructive text-white flex items-center justify-center">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <label className={cn(inputCls, "cursor-pointer inline-flex items-center gap-2 text-muted-foreground")}>
              <Upload className="w-4 h-4" /> Bild hochladen
              <input type="file" accept="image/*" onChange={uploadThumb} className="hidden" />
            </label>
          )}
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs text-muted-foreground mb-1.5 block">Beschreibung</label>
          <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="Was passiert heute? Wonach ist dir?" className={cn(inputCls, "resize-none")} />
        </div>
      </div>

      <div className="flex gap-2 mt-5">
        <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? "Speichern…" : "Speichern"}
        </button>
        <button onClick={onCancel} className="px-5 py-2.5 rounded-full bg-elevated border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
          Abbrechen
        </button>
      </div>
    </div>
  );
}