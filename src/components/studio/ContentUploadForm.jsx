import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Plus, Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { Image } from "@/components/ui/image";

const input = "w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50";

const TYPES = [
  { id: "PHOTO", label: "Foto" },
  { id: "PHOTO_SET", label: "Fotoserie" },
  { id: "VIDEO", label: "Video" },
  { id: "AUDIO", label: "Audio" },
  { id: "TEASER", label: "Teaser" },
];

const VISIBILITIES = ["PUBLIC", "REGISTERED", "FREE_MEMBER", "VIP", "PPV", "PRIVATE", "UNLISTED"];

// Eigene Dateien hochladen und daraus einen Inhalt machen — ohne Umweg.
export default function ContentUploadForm({ creators = [], onCreated }) {
  const { toast } = useToast();
  const fileRef = useRef(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    contentType: "PHOTO",
    price: 0,
    visibility: "REGISTERED",
    published: true,
    creatorId: "",
  });

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const pickFile = (event) => {
    const picked = event.target.files?.[0];
    event.target.value = "";
    if (!picked) return;
    setFile(picked);
    setPreview(picked.type.startsWith("image/") ? URL.createObjectURL(picked) : null);
    if (!form.title) set("title", picked.name.replace(/\.[^.]+$/, ""));
  };

  const save = async () => {
    if (!file || !form.title.trim()) return;
    setSaving(true);
    try {
      const up = await base44.integrations.Core.UploadPublicFile({ file });
      const url = up.file_url;
      const creator = creators.find((c) => c.id === form.creatorId);
      await base44.entities.Content.create({
        title: form.title.trim(),
        description: form.description,
        contentType: form.contentType,
        creatorId: form.creatorId || undefined,
        creatorName: creator?.stageName || undefined,
        fullAsset: url,
        previewAsset: url,
        thumbnail: url,
        price: Number(form.price) || 0,
        currency: "EUR",
        isFree: (Number(form.price) || 0) === 0,
        visibility: form.visibility,
        published: form.published,
      });
      toast({ title: "Hochgeladen", description: `"${form.title}" ist drin.` });
      setForm({ title: "", description: "", contentType: "PHOTO", price: 0, visibility: "REGISTERED", published: true, creatorId: "" });
      setFile(null);
      setPreview(null);
      setOpen(false);
      onCreated?.();
    } catch (e) {
      toast({ title: "Nicht hochgeladen", description: "Versuch es nochmal.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn glass-btn-accent text-[15px] font-bold text-gloss"
      >
        <Plus className="w-4 h-4" /> Eigenen Inhalt hochladen
      </button>
    );
  }

  return (
    <div className="glass rounded-2xl border border-border p-5">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="font-display text-xl text-foreground">Eigenen Inhalt hochladen</p>
          <p className="text-[15px] font-semibold text-muted-foreground">
            Datei von deinem Rechner reinlegen — Bild, Video oder Ton. Danach Preis und Sichtbarkeit festlegen.
          </p>
        </div>
        <button onClick={() => setOpen(false)} className="w-9 h-9 rounded-full glass-btn flex items-center justify-center text-muted-foreground hover:text-foreground flex-shrink-0">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Titel" className={input} />
        <select value={form.contentType} onChange={(e) => set("contentType", e.target.value)} className={input}>
          {TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
        <input value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Kurze Beschreibung" className={input} />
        <select value={form.creatorId} onChange={(e) => set("creatorId", e.target.value)} className={input}>
          <option value="">Keinem Charakter zuordnen</option>
          {creators.map((c) => (
            <option key={c.id} value={c.id}>{c.stageName}</option>
          ))}
        </select>
        <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} placeholder="Preis in € — 0 heißt gratis" className={input} />
        <select value={form.visibility} onChange={(e) => set("visibility", e.target.value)} className={input}>
          {VISIBILITIES.map((v) => <option key={v} value={v}>{v.replace(/_/g, " ")}</option>)}
        </select>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <button onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full glass-btn text-[15px] font-bold text-foreground">
          <Upload className="w-4 h-4" /> {file ? "Andere Datei wählen" : "Datei wählen"}
        </button>
        <input ref={fileRef} type="file" accept="image/*,video/*,audio/*" onChange={pickFile} className="hidden" />
        {file && (
          <span className="inline-flex items-center gap-2 text-[13px] font-semibold text-muted-foreground">
            {preview ? <Image src={preview} fittingType="fill" className="w-24 h-24 rounded-2xl" /> : null}
            {file.name}
          </span>
        )}
        <label className="flex items-center gap-2 text-[15px] font-semibold text-muted-foreground">
          <input type="checkbox" checked={form.published} onChange={(e) => set("published", e.target.checked)} className="accent-[hsl(var(--primary))]" /> Sofort live
        </label>
      </div>

      <button
        onClick={save}
        disabled={saving || !file || !form.title.trim()}
        className={cn(
          "inline-flex items-center gap-2 px-6 py-3 rounded-full glass-btn glass-btn-accent text-[15px] font-bold text-gloss disabled:opacity-50"
        )}
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        {saving ? "Lädt hoch …" : "Hochladen"}
      </button>
    </div>
  );
}