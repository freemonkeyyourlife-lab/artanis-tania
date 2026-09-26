import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, X, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";

const inputCls = "w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 appearance-none";

export default function UploadForm({ onSaved, onCancel }) {
  const [form, setForm] = useState({ title: "", description: "", topics: "" });
  const [media, setMedia] = useState(null);
  const [mediaType, setMediaType] = useState("IMAGE");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadPublicFile({ file });
      setMedia(res.file_url);
      setMediaType(file.type.startsWith("video") ? "VIDEO" : "IMAGE");
    } catch (err) {
      console.error(err);
      toast({ title: "Upload fehlgeschlagen", variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const save = async () => {
    if (!media) {
      toast({ title: "Lade zuerst ein Bild oder Video hoch", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const me = await base44.auth.me();
      await base44.entities.UserPost.create({
        userId: me.id,
        userName: me.full_name || me.email,
        title: form.title,
        description: form.description,
        mediaType,
        mediaUrl: media,
        topics: form.topics.split(",").map((s) => s.trim()).filter(Boolean),
        likes: 0,
        likedBy: [],
        ratingSum: 0,
        ratingCount: 0,
        ratedBy: {},
      });
      toast({ title: "Hochgeladen!", description: "Andere können es jetzt sehen und bewerten." });
      onSaved();
    } catch (err) {
      console.error(err);
      toast({ title: "Fehler beim Speichern", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 mb-6">
      <h3 className="font-display text-lg text-foreground mb-1">Selbst Darsteller sein</h3>
      <p className="text-xs text-muted-foreground mb-4">Lade dein Bild oder Video hoch — andere können es anschauen und bewerten.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Bild oder Video</label>
          {media ? (
            <div className="relative w-full aspect-[3/4] rounded-xl overflow-hidden bg-elevated">
              {mediaType === "VIDEO" ? (
                <video src={media} controls playsInline className="w-full h-full object-cover" />
              ) : (
                <Image src={media} fittingType="fill" className="w-full h-full" />
              )}
              <button onClick={() => setMedia(null)} className="absolute top-2 right-2 w-7 h-7 rounded-full bg-destructive text-white flex items-center justify-center">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <label className={cn(inputCls, "cursor-pointer inline-flex items-center gap-2 text-muted-foreground")}>
              <Upload className="w-4 h-4" /> {uploading ? "Lädt hoch…" : "Datei wählen"}
              <input type="file" accept="image/*,video/*" onChange={handleFile} className="hidden" />
            </label>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Titel</label>
            <input value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="z. B. Mein erstes Mal vor der Kamera" className={inputCls} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Beschreibung</label>
            <textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} placeholder="Erzähl, was man sieht." className={cn(inputCls, "resize-none")} />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Themen (mit Komma trennen)</label>
            <input value={form.topics} onChange={(e) => set("topics", e.target.value)} placeholder="sinnlich, outdoor, solo" className={inputCls} />
          </div>
        </div>
      </div>

      <div className="flex gap-2 mt-5">
        <button onClick={save} disabled={saving || uploading} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
          <Save className="w-4 h-4" /> {saving ? "Speichern…" : "Veröffentlichen"}
        </button>
        <button onClick={onCancel} className="px-5 py-2.5 rounded-full bg-elevated border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
          Abbrechen
        </button>
      </div>
    </div>
  );
}