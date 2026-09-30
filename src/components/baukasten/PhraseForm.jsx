import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Save, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { PHRASE_STAGES, PHRASE_SITUATIONS, PHRASE_VOICES } from "@/lib/phrases";

// Eine Sprechzeile anlegen oder ändern. Stufe und Situation legen fest, wo sie
// später auftaucht — im Baustein ist sie dann nur noch ein Klick.
export default function PhraseForm({ initial, onSaved, onCancel }) {
  const [form, setForm] = useState({
    text: initial?.text || "",
    stage: initial?.stage || "ANKOMMEN",
    situation: initial?.situation || "",
    voice: initial?.voice || "honey",
    tags: initial?.tags || [],
  });
  const [tagInput, setTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (patch) => setForm((prev) => ({ ...prev, ...patch }));

  const addTag = () => {
    const value = tagInput.trim();
    if (!value || form.tags.includes(value)) return;
    set({ tags: [...form.tags, value] });
    setTagInput("");
  };

  const save = async () => {
    if (!form.text.trim()) {
      setError("Schreib hin, was gesagt werden soll.");
      return;
    }
    setSaving(true);
    setError("");
    const data = { ...form, text: form.text.trim() };
    try {
      if (initial?.id) await base44.entities.VoicePhrase.update(initial.id, data);
      else await base44.entities.VoicePhrase.create(data);
      onSaved();
    } catch (e) {
      setError("Speichern hat nicht geklappt.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="glass rounded-2xl border-2 border-primary/40 p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-xl text-foreground">
          {initial?.id ? "Sprechzeile ändern" : "Neue Sprechzeile"}
        </p>
        <button
          onClick={onCancel}
          className="w-9 h-9 rounded-full bg-elevated text-muted-foreground flex items-center justify-center hover:text-foreground transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div>
        <label className="text-[14px] font-bold text-foreground">Was wird gesagt?</label>
        <textarea
          value={form.text}
          onChange={(e) => set({ text: e.target.value })}
          rows={2}
          placeholder="Genau der Satz, so wie sie ihn sagen soll."
          className="mt-1.5 w-full rounded-2xl border-2 border-input bg-transparent px-4 py-3 text-[15px] font-semibold text-foreground resize-none focus:outline-none focus:border-primary"
        />
      </div>

      <div>
        <label className="text-[14px] font-bold text-foreground">Stufe</label>
        <div className="flex flex-wrap gap-2 mt-2">
          {PHRASE_STAGES.map((s) => (
            <button
              key={s.id}
              onClick={() => set({ stage: s.id })}
              title={s.hint}
              className={cn(
                "px-3.5 py-2 rounded-full border-2 text-[13px] font-bold transition-colors",
                form.stage === s.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <label className="text-[14px] font-bold text-foreground">Situation</label>
          <Input
            value={form.situation}
            onChange={(e) => set({ situation: e.target.value })}
            placeholder="Wo das gesagt wird"
            className="mt-1.5 h-11 text-[15px] font-semibold"
          />
          <div className="flex flex-wrap gap-1.5 mt-2">
            {PHRASE_SITUATIONS.map((s) => (
              <button
                key={s}
                onClick={() => set({ situation: form.situation === s ? "" : s })}
                className={cn(
                  "px-2.5 py-1 rounded-full border text-[12px] font-bold transition-colors",
                  form.situation === s ? "border-primary text-primary" : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-[14px] font-bold text-foreground">Stimme</label>
          <select
            value={form.voice}
            onChange={(e) => set({ voice: e.target.value })}
            className="mt-1.5 w-full h-11 rounded-xl border-2 border-input bg-transparent px-3 text-[15px] font-semibold text-foreground"
          >
            {PHRASE_VOICES.map((v) => (
              <option key={v.id} value={v.id}>{v.label}</option>
            ))}
          </select>
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
          <div className="flex gap-2 mt-2">
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
              +
            </button>
          </div>
        </div>
      </div>

      {error && <p className="text-[14px] font-bold text-destructive">{error}</p>}

      <div className="flex flex-wrap gap-2">
        <button
          onClick={save}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full glass-btn glass-btn-accent text-[14px] font-bold text-gloss disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {saving ? "Speichert …" : "Sprechzeile speichern"}
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