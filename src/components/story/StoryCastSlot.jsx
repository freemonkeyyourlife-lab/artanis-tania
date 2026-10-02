import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Loader2, Upload, Check, Volume2, Square, UserPlus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { NARRATOR_VOICES, kindOf } from "@/lib/narratorStyle";

const inputCls =
  "w-full px-4 py-2.5 rounded-xl bg-background border border-border text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50";
const TEST_LINE = "Ich bin da. Wir gehen zusammen durch diese Geschichte.";

// Ein Platz für eine Erzählerin — mit eigenem Aussehen, eigener Persönlichkeit
// und eigenem Stimm-Typ, unabhängig vom anderen Platz.
export default function StoryCastSlot({ slot, narrator, all, assignedIds, onAssign, onClear, onSave, onCreate }) {
  const [form, setForm] = useState(null);
  const [newName, setNewName] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    setForm(
      narrator
        ? {
            name: narrator.name || "",
            personality: narrator.personality || "",
            voice: narrator.voice || "honey",
            artStyle: narrator.artStyle || "PHOTOREAL",
            avatar: narrator.avatar || "",
          }
        : null
    );
  }, [narrator?.id, narrator?.updated_date]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const label = slot === 0 ? "Erzählerin 1" : "Erzählerin 2";

  const stopVoice = () => {
    audioRef.current?.pause();
    setPlaying(false);
  };

  const hearVoice = async (voice) => {
    stopVoice();
    setPlaying(true);
    try {
      const res = await base44.integrations.Core.GenerateSpeech({ text: TEST_LINE, voice });
      const audio = new Audio(res.url);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.onerror = () => setPlaying(false);
      await audio.play();
    } catch (e) {
      setPlaying(false);
    }
  };

  const upload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadPublicFile({ file });
      set({ avatar: res.file_url });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const save = async () => {
    if (!form?.name.trim()) return;
    setBusy(true);
    try {
      await onSave(narrator, { ...form, name: form.name.trim() });
    } finally {
      setBusy(false);
    }
  };

  // Platz frei: jemanden auswählen oder neu anlegen.
  if (!narrator || !form) {
    const free = all.filter((n) => !assignedIds.includes(n.id));
    return (
      <div className="rounded-2xl border-2 border-dashed border-border bg-card p-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-3">{label} · Platz frei</p>

        {free.length > 0 ? (
          <div className="space-y-1.5 mb-3">
            {free.map((n) => (
              <button
                key={n.id}
                onClick={() => onAssign(slot, n)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl bg-elevated border border-border hover:border-primary/50 transition-colors text-left"
              >
                {n.avatar ? (
                  <Image src={n.avatar} fittingType="fill" className="w-9 h-9 rounded-full flex-shrink-0" />
                ) : (
                  <span className="w-9 h-9 rounded-full bg-background flex items-center justify-center font-display text-[13px] text-primary flex-shrink-0">
                    {n.name.slice(0, 1)}
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block text-[13px] font-bold text-foreground truncate">{n.name}</span>
                  <span className="block text-[11px] font-semibold text-muted-foreground truncate">
                    {kindOf(n.kind).label}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <p className="text-[13px] font-semibold text-muted-foreground mb-3">Keine weitere Erzählerin vorhanden.</p>
        )}

        <div className="flex gap-2">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Neue Erzählerin anlegen"
            className={cn(inputCls, "flex-1")}
          />
          <button
            onClick={() => {
              if (!newName.trim()) return;
              onCreate(slot, newName.trim());
              setNewName("");
            }}
            disabled={!newName.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full glass-btn text-[12px] font-bold text-foreground disabled:opacity-50 whitespace-nowrap"
          >
            <UserPlus className="w-3.5 h-3.5" /> Anlegen
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border-2 border-primary/40 bg-card p-4">
      <div className="flex items-center gap-3 mb-4">
        {form.avatar ? (
          <Image src={form.avatar} fittingType="fill" className="w-14 h-14 rounded-2xl flex-shrink-0" />
        ) : (
          <span className="w-14 h-14 rounded-2xl bg-elevated border border-border flex items-center justify-center font-display text-xl text-primary flex-shrink-0">
            {form.name.slice(0, 1)}
          </span>
        )}
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-wider text-primary">{label}</p>
          <p className="font-display text-lg text-foreground truncate">{form.name || "Ohne Namen"}</p>
        </div>
        <button
          onClick={() => {
            stopVoice();
            onClear(slot);
          }}
          className="ml-auto w-8 h-8 rounded-full bg-destructive/15 text-destructive flex items-center justify-center flex-shrink-0"
          title="Platz freigeben"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Aussehen</p>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full glass-btn text-[12px] font-bold text-foreground cursor-pointer">
          {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Bild
          <input type="file" accept="image/*" onChange={upload} className="hidden" />
        </label>
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

      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Name</p>
      <input value={form.name} onChange={(e) => set({ name: e.target.value })} className={cn(inputCls, "mb-3")} />

      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Persönlichkeit</p>
      <textarea
        value={form.personality}
        onChange={(e) => set({ personality: e.target.value })}
        rows={3}
        placeholder="Wie ist sie? Was macht sie mit dir?"
        className={cn(inputCls, "resize-none mb-3")}
      />

      <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Stimm-Typ</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {NARRATOR_VOICES.map((v) => (
          <button
            key={v.id}
            onClick={() => {
              set({ voice: v.id });
              hearVoice(v.id);
            }}
            className={cn(
              "px-3.5 py-2 rounded-full text-[12px] font-bold transition-colors",
              form.voice === v.id ? "glass-btn glass-btn-accent text-gloss" : "glass-btn text-muted-foreground"
            )}
          >
            {v.label} <span className="font-semibold opacity-70">{v.hint}</span>
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={save}
          disabled={busy || !form.name.trim()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn glass-btn-accent text-[13px] font-bold text-gloss disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Speichern
        </button>
        <button
          onClick={() => (playing ? stopVoice() : hearVoice(form.voice))}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[13px] font-bold text-foreground"
        >
          {playing ? <Square className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          {playing ? "Stopp" : "Stimme hören"}
        </button>
      </div>
    </div>
  );
}