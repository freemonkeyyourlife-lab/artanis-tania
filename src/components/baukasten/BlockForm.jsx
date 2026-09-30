import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, X, Plus, Save, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import {
  BLOCK_KINDS, SITUATION_PRESETS, VARIANT_PRESETS, MEDIA_LABEL, uploadMedia, blockMedia,
} from "@/lib/baukasten";

// Ein Baustein entsteht: Situation, Datei oder Szene — je nachdem, was du
// daraus machen willst. Alles lässt sich später wieder ändern.
export default function BlockForm({ initial, onSaved, onCancel }) {
  const [form, setForm] = useState({
    title: initial?.title || "",
    blockKind: initial?.blockKind || "SITUATION",
    personaName: initial?.personaName || "",
    situation: initial?.situation || "",
    variants: initial?.variants || [],
    activeVariants: initial?.activeVariants || [],
    mediaType: initial?.mediaType || "IMAGE",
    mediaItems: blockMedia(initial || {}),
    voiceLine: initial?.voiceLine || "",
    tags: initial?.tags || [],
    note: initial?.note || "",
  });
  const [variantInput, setVariantInput] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const pickFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    setUploading(true);
    try {
      const added = await uploadMedia(files);
      set({ mediaItems: [...form.mediaItems, ...added] });
    } catch (e) {
      setError("Die Datei kam nicht durch.");
    } finally {
      setUploading(false);
    }
  };

  const toggleVariant = (name) =>
    set({
      activeVariants: form.activeVariants.includes(name)
        ? form.activeVariants.filter((v) => v !== name)
        : [...form.activeVariants, name],
    });

  const addVariant = () => {
    const value = variantInput.trim();
    if (!value) return;
    if (!form.variants.includes(value)) set({ variants: [...form.variants, value] });
    if (!form.activeVariants.includes(value)) set({ activeVariants: [...form.activeVariants, value] });
    setVariantInput("");
  };

  const addTag = () => {
    const value = tagInput.trim();
    if (!value || form.tags.includes(value)) return;
    set({ tags: [...form.tags, value] });
    setTagInput("");
  };

  const save = async () => {
    if (!form.title.trim()) {
      setError("Gib dem Baustein einen Namen.");
      return;
    }
    setSaving(true);
    setError("");
    const data = {
      ...form,
      title: form.title.trim(),
      mediaUrl: form.mediaItems[0]?.url || "",
      mediaType: form.mediaItems[0]?.type || form.mediaType,
    };
    try {
      if (initial?.id) await base44.entities.BuildBlock.update(initial.id, data);
      else await base44.entities.BuildBlock.create(data);
      onSaved();
    } catch (e) {
      setError("Speichern hat nicht geklappt.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass rounded-2xl border-2 border-primary/40 p-5 space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-xl text-foreground">
          {initial?.id ? "Baustein ändern" : "Neuer Baustein"}
        </p>
        <button
          onClick={onCancel}
          className="w-9 h-9 rounded-full bg-elevated text-muted-foreground flex items-center justify-center hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div>
        <p className="text-[14px] font-bold text-foreground mb-2">Was für ein Baustein ist das?</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {BLOCK_KINDS.map((kind) => (
            <button
              key={kind.id}
              onClick={() => set({ blockKind: kind.id })}
              className={cn(
                "text-left rounded-2xl border-2 p-3 transition-colors",
                form.blockKind === kind.id ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
              )}
            >
              <span className="block font-display text-[15px] text-foreground">{kind.label}</span>
              <span className="block text-[12px] font-semibold text-muted-foreground mt-1">{kind.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-[14px] font-bold text-foreground">Name</label>
          <Input
            value={form.title}
            onChange={(e) => set({ title: e.target.value })}
            placeholder="Zum Beispiel: Glas auf dem Tisch"
            className="mt-1.5 h-11 text-[15px] font-semibold"
          />
        </div>
        <div>
          <label className="text-[14px] font-bold text-foreground">Wem gehört das?</label>
          <Input
            value={form.personaName}
            onChange={(e) => set({ personaName: e.target.value })}
            placeholder="Dein Name oder der deiner Partnerin"
            className="mt-1.5 h-11 text-[15px] font-semibold"
          />
        </div>
      </div>

      <div>
        <label className="text-[14px] font-bold text-foreground">Grundeinstellung</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {SITUATION_PRESETS.map((preset) => (
            <button
              key={preset}
              onClick={() => set({ situation: form.situation === preset ? "" : preset })}
              className={cn(
                "px-3.5 py-2 rounded-full border-2 text-[13px] font-bold transition-colors",
                form.situation === preset ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {preset}
            </button>
          ))}
        </div>
        <Input
          value={form.situation}
          onChange={(e) => set({ situation: e.target.value })}
          placeholder="Oder eigene Grundeinstellung"
          className="mt-2 h-11 text-[15px] font-semibold max-w-md"
        />
      </div>

      <div>
        <label className="text-[14px] font-bold text-foreground">Varianten</label>
        <p className="text-[13px] font-semibold text-muted-foreground mb-2">
          Angekreuzt heißt: gehört zu diesem Baustein. Abgekreuzt bleibt es zum späteren Anwählen da.
        </p>
        <div className="flex flex-wrap gap-2">
          {[...new Set([...VARIANT_PRESETS, ...form.variants])].map((preset) => {
            const on = form.activeVariants.includes(preset);
            return (
              <button
                key={preset}
                onClick={() => toggleVariant(preset)}
                className={cn(
                  "px-3.5 py-2 rounded-full border-2 text-[13px] font-bold transition-colors",
                  on ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {on ? "✓ " : ""}{preset}
              </button>
            );
          })}
        </div>
        <div className="flex gap-2 mt-2 max-w-md">
          <Input
            value={variantInput}
            onChange={(e) => setVariantInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addVariant()}
            placeholder="Eigene Variante"
            className="h-11 text-[15px] font-semibold"
          />
          <button
            onClick={addVariant}
            className="w-11 h-11 rounded-xl bg-elevated border border-border text-muted-foreground flex items-center justify-center flex-shrink-0 hover:text-foreground transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div>
        <label className="text-[14px] font-bold text-foreground">
          Dateien {form.blockKind === "SZENE" ? "(mehrere für eine Szene)" : ""}
        </label>
        <label className="cursor-pointer inline-flex items-center gap-2 mt-2 px-5 py-2.5 rounded-xl bg-elevated border-2 border-border text-[14px] font-bold text-muted-foreground hover:text-foreground transition-colors">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          {uploading ? "Lädt hoch …" : "Bilder, Videos oder Ton"}
          <input
            type="file"
            accept="image/*,video/*,audio/*"
            multiple
            onChange={pickFiles}
            className="hidden"
            disabled={uploading}
          />
        </label>

        {form.mediaItems.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {form.mediaItems.map((item, index) => (
              <div key={`${item.url}-${index}`} className="relative">
                {item.type === "IMAGE" ? (
                  <Image src={item.url} fittingType="fill" className="w-28 h-28 rounded-2xl" />
                ) : item.type === "VIDEO" ? (
                  <video src={item.url} className="w-28 h-28 rounded-2xl object-cover" muted />
                ) : (
                  <div className="w-28 h-28 rounded-2xl bg-elevated flex items-center justify-center text-[12px] font-bold text-muted-foreground">
                    {MEDIA_LABEL.AUDIO}
                  </div>
                )}
                <button
                  onClick={() => set({ mediaItems: form.mediaItems.filter((_, i) => i !== index) })}
                  className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-destructive text-white flex items-center justify-center"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="text-[14px] font-bold text-foreground">Was soll die Stimme sagen?</label>
        <textarea
          value={form.voiceLine}
          onChange={(e) => set({ voiceLine: e.target.value })}
          rows={2}
          placeholder="Genau der Satz, den sie in dieser Situation sagt."
          className="mt-1.5 w-full rounded-2xl border-2 border-input bg-transparent px-4 py-3 text-[15px] font-semibold text-foreground resize-none focus:outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="text-[14px] font-bold text-foreground">Schlagworte</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {form.tags.map((tag) => (
            <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-elevated text-[13px] font-bold text-foreground">
              {tag}
              <button onClick={() => set({ tags: form.tags.filter((t) => t !== tag) })}>
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2 mt-2 max-w-md">
          <Input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addTag()}
            placeholder="Schlagwort"
            className="h-11 text-[15px] font-semibold"
          />
          <button
            onClick={addTag}
            className="w-11 h-11 rounded-xl bg-elevated border border-border text-muted-foreground flex items-center justify-center flex-shrink-0 hover:text-foreground transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div>
        <label className="text-[14px] font-bold text-foreground">Notiz</label>
        <Input
          value={form.note}
          onChange={(e) => set({ note: e.target.value })}
          placeholder="Was du dir dazu merken willst"
          className="mt-1.5 h-11 text-[15px] font-semibold"
        />
      </div>

      {error && <p className="text-[14px] font-bold text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={save}
          disabled={saving || uploading}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full glass-btn glass-btn-accent text-[14px] font-bold text-gloss disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Speichert …" : "Baustein speichern"}
        </button>
        <button
          onClick={onCancel}
          className="px-6 py-2.5 rounded-full text-[14px] font-bold text-muted-foreground hover:text-foreground transition-colors"
        >
          Abbrechen
        </button>
      </div>
    </div>
  );
}