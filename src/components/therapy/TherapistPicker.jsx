import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import { Loader2, Plus, Upload, X } from "lucide-react";

const EMPTY = { name: "", age: "", type: "", style: "", role: "", bio: "", avatar: "" };

// Die Therapeutin dieser Sitzung: eine bestehende nehmen, selbst eine anlegen
// und ihr Gesicht hochladen — oder bei Triania bleiben.
export default function TherapistPicker({ therapist, onChange, therapists = [], onSaved }) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(EMPTY);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const pick = (t) => onChange({
    id: t.id || "",
    name: t.name || "Triania",
    age: t.age || "",
    type: t.type || "",
    avatar: t.avatar || "",
  });

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadPublicFile({ file });
      setDraft((d) => ({ ...d, avatar: res.file_url }));
    } catch (e) {
      console.error(e);
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!draft.name.trim() || saving) return;
    setSaving(true);
    try {
      const created = await base44.entities.Therapist.create({
        name: draft.name.trim(),
        age: Number(draft.age) || undefined,
        type: draft.type.trim(),
        style: draft.style.trim(),
        role: draft.role.trim(),
        bio: draft.bio.trim(),
        avatar: draft.avatar,
        tags: ["Therapeutin"],
      });
      onSaved?.(created);
      pick(created);
      setDraft(EMPTY);
      setOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const chip = (active) =>
    cn(
      "flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border text-sm transition-colors",
      active
        ? "bg-primary text-primary-foreground border-primary"
        : "bg-elevated border-border text-muted-foreground hover:text-foreground hover:border-primary/50"
    );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => pick({ name: "Triania" })} className={chip(!therapist.id && therapist.name === "Triania")}>
          {therapist.avatar || !therapist.id ? null : null}
          <span className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[11px] font-bold">T</span>
          Triania (Standard)
        </button>
        {therapists.map((t) => (
          <button key={t.id} type="button" onClick={() => pick(t)} className={chip(therapist.id === t.id)}>
            {t.avatar ? (
              <Image src={t.avatar} fittingType="fill" className="w-7 h-7 rounded-full" />
            ) : (
              <span className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-[11px] font-bold">{(t.name || "?")[0]}</span>
            )}
            {t.name}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={cn("inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-sm transition-colors", open ? "bg-primary text-primary-foreground border-primary" : "bg-elevated border-border text-muted-foreground hover:text-foreground hover:border-primary/50")}
        >
          <Plus className="w-3.5 h-3.5" /> Neue Therapeutin
        </button>
      </div>

      {open && (
        <div className="rounded-2xl border border-border bg-background p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-foreground">Therapeutin anlegen</p>
            <button type="button" onClick={() => setOpen(false)} className="w-7 h-7 rounded-full bg-elevated flex items-center justify-center text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-elevated overflow-hidden flex-shrink-0 flex items-center justify-center">
              {draft.avatar ? <Image src={draft.avatar} fittingType="fill" className="w-full h-full" /> : <span className="text-xs text-muted-foreground">Bild</span>}
            </div>
            <div className="flex-1">
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-elevated border border-border text-xs font-semibold text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Foto hochladen
              </button>
              <p className="text-[11px] text-muted-foreground mt-1">Ihr Gesicht — sie bleibt in allen Sitzungen dieselbe.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <input value={draft.name} onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))} placeholder="Name" className="flex-1 min-w-[140px] px-3.5 py-2.5 rounded-full bg-card border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
            <input value={draft.age} onChange={(e) => setDraft((d) => ({ ...d, age: e.target.value }))} placeholder="Alter" inputMode="numeric" className="w-24 px-3.5 py-2.5 rounded-full bg-card border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
            <input value={draft.type} onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value }))} placeholder="Typ / Fachrichtung" className="flex-1 min-w-[160px] px-3.5 py-2.5 rounded-full bg-card border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
          </div>

          <textarea value={draft.role} onChange={(e) => setDraft((d) => ({ ...d, role: e.target.value }))} rows={2} placeholder="Welche Rolle nimmt sie ein? (z.B. streng, aber gerecht — wie eine Ärztin, die keine Ausreden gelten lässt)" className="w-full px-3.5 py-2.5 rounded-2xl bg-card border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none" />
          <textarea value={draft.style} onChange={(e) => setDraft((d) => ({ ...d, style: e.target.value }))} rows={2} placeholder="Wie soll sie antworten? (Ton, Tempo, Wortwahl)" className="w-full px-3.5 py-2.5 rounded-2xl bg-card border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none" />
          <textarea value={draft.bio} onChange={(e) => setDraft((d) => ({ ...d, bio: e.target.value }))} rows={2} placeholder="Ihre Geschichte (optional)" className="w-full px-3.5 py-2.5 rounded-2xl bg-card border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none" />

          <button type="button" onClick={save} disabled={saving || !draft.name.trim()} className="w-full py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
            {saving ? "Wird angelegt …" : "Anlegen und auswählen"}
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <input
          value={therapist.age}
          onChange={(e) => onChange({ ...therapist, age: e.target.value })}
          placeholder="Alter"
          inputMode="numeric"
          className="w-24 px-3.5 py-2.5 rounded-full bg-background border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
        />
        <input
          value={therapist.type}
          onChange={(e) => onChange({ ...therapist, type: e.target.value })}
          placeholder="Fachrichtung"
          className="flex-1 min-w-[180px] px-3.5 py-2.5 rounded-full bg-background border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
        />
      </div>
    </div>
  );
}