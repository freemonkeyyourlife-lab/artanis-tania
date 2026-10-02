import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Trash2, Upload, Check, X } from "lucide-react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import { NARRATOR_KINDS, NARRATOR_VOICES } from "@/lib/narratorStyle";

const inputCls =
  "w-full px-4 py-2.5 rounded-xl bg-background border border-border text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50";

// Aussehen, Typ, Persönlichkeit und Stimme einer Erzählerin.
export default function NarratorEditor({ narrator, onSaved, onDeleted, onCancel, onError }) {
  const [form, setForm] = useState({
    name: narrator?.name || "",
    kind: narrator?.kind || "ERZAEHLERIN",
    personality: narrator?.personality || "",
    voice: narrator?.voice || "honey",
    artStyle: narrator?.artStyle || "PHOTOREAL",
    avatar: narrator?.avatar || "",
  });
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadPublicFile({ file });
      set({ avatar: res.file_url });
    } catch (err) {
      onError?.();
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setBusy(true);
    try {
      const payload = { ...form, name: form.name.trim() };
      const rec = narrator?.id
        ? await base44.entities.Narrator.update(narrator.id, payload)
        : await base44.entities.Narrator.create({ ...payload, order: Date.now() });
      onSaved(rec);
    } catch (e) {
      onError?.();
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!narrator?.id) return onCancel();
    if (!window.confirm(`"${narrator.name}" entfernen?`)) return;
    await base44.entities.Narrator.delete(narrator.id);
    onDeleted(narrator.id);
  };

  return (
    <div className="mt-4 pt-4 border-t border-border">
      <div className="flex items-center gap-3 mb-4">
        {form.avatar ? (
          <Image src={form.avatar} fittingType="fill" className="w-16 h-16 rounded-2xl" />
        ) : (
          <span className="w-16 h-16 rounded-2xl bg-elevated border border-border flex items-center justify-center text-[11px] font-bold text-muted-foreground">
            kein Bild
          </span>
        )}
        <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full glass-btn text-[12px] font-bold text-foreground cursor-pointer">
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Bild wählen
          <input type="file" accept="image/*" onChange={upload} className="hidden" />
        </label>
        <div className="flex flex-wrap gap-1.5">
          {["PHOTOREAL", "CARTOON"].map((a) => (
            <button
              key={a}
              onClick={() => set({ artStyle: a })}
              className={cn(
                "px-3.5 py-2 rounded-full text-[12px] font-bold transition-colors",
                form.artStyle === a ? "glass-btn glass-btn-accent text-gloss" : "glass-btn text-muted-foreground"
              )}
            >
              {a === "PHOTOREAL" ? "Fotoreal" : "Gezeichnet"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Name</label>
          <input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="z. B. Mira" className={inputCls} />
        </div>
        <div>
          <label className="block text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Typ</label>
          <select value={form.kind} onChange={(e) => set({ kind: e.target.value })} className={inputCls}>
            {NARRATOR_KINDS.map((k) => (
              <option key={k.id} value={k.id}>{k.label}</option>
            ))}
          </select>
        </div>
      </div>

      <label className="block text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 mt-3">Persönlichkeit</label>
      <textarea
        value={form.personality}
        onChange={(e) => set({ personality: e.target.value })}
        rows={3}
        placeholder="Wie ist sie? Was macht sie mit dir? Was sagt sie nie?"
        className={cn(inputCls, "resize-none")}
      />

      <label className="block text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5 mt-3">Stimme</label>
      <div className="flex flex-wrap gap-1.5">
        {NARRATOR_VOICES.map((v) => (
          <button
            key={v.id}
            onClick={() => set({ voice: v.id })}
            className={cn(
              "px-3.5 py-2 rounded-full text-[12px] font-bold transition-colors",
              form.voice === v.id ? "glass-btn glass-btn-accent text-gloss" : "glass-btn text-muted-foreground"
            )}
          >
            {v.label} <span className="font-semibold opacity-70">{v.hint}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2 mt-4">
        <button
          onClick={save}
          disabled={busy || !form.name.trim()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn glass-btn-accent text-[13px] font-bold text-gloss disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Speichern
        </button>
        <button onClick={onCancel} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[13px] font-bold text-muted-foreground">
          <X className="w-4 h-4" /> Abbrechen
        </button>
        {narrator?.id && (
          <button onClick={remove} className="ml-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-destructive/15 text-destructive text-[13px] font-bold">
            <Trash2 className="w-4 h-4" /> Entfernen
          </button>
        )}
      </div>
    </div>
  );
}