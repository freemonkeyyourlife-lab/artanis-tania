import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Sparkles, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import SpeakField from "@/components/voice/SpeakField";
import PeoplePicker from "@/components/ideen/PeoplePicker";
import IdeaImages from "@/components/ideen/IdeaImages";
import { IDEA_KINDS, IDEA_STATUS } from "@/lib/ideen";
import { btnAccentCls, btnCls, chipCls, inputCls, labelCls } from "@/lib/narratorUi";

const empty = () => ({
  title: "",
  kind: "IDEE",
  idea: "",
  story: "",
  people: [],
  prompt: "",
  images: [],
  status: "IDEE",
});

export default function IdeaForm({ idea, onSaved, onCancel, onDeleted }) {
  const [draft, setDraft] = useState(() => ({ ...empty(), ...(idea || {}) }));
  const [saving, setSaving] = useState(false);
  const [writing, setWriting] = useState(false);
  const set = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const save = async () => {
    if (!draft.title.trim()) return;
    setSaving(true);
    try {
      const payload = { ...draft, title: draft.title.trim() };
      const saved = idea?.id
        ? await base44.entities.Idea.update(idea.id, payload)
        : await base44.entities.Idea.create(payload);
      onSaved(saved);
    } finally {
      setSaving(false);
    }
  };

  // Aus der Idee wird der Prompt — so, wie ich sie verstanden habe.
  const writePrompt = async () => {
    setWriting(true);
    try {
      const text = await base44.integrations.Core.InvokeLLM({
        prompt: [
          "Schreibe aus dieser Idee einen fertigen Bild-Prompt auf Deutsch.",
          `Titel: ${draft.title}`,
          `Art: ${draft.kind}`,
          draft.idea ? `Idee: ${draft.idea}` : "",
          draft.story ? `Geschichte: ${draft.story}` : "",
          draft.people?.length ? `Menschen: ${draft.people.map((p) => p.name).join(", ")}` : "",
          "Antworte nur mit dem Prompt, ohne Anführungszeichen und ohne Erklärung.",
        ]
          .filter(Boolean)
          .join("\n"),
      });
      set({ prompt: String(text).trim() });
    } finally {
      setWriting(false);
    }
  };

  const remove = async () => {
    if (!idea?.id || !window.confirm(`„${draft.title}“ aus dem Ordner nehmen?`)) return;
    await base44.entities.Idea.delete(idea.id);
    onDeleted(idea.id);
  };

  return (
    <div className="rounded-2xl border-2 border-primary/30 bg-card p-5 space-y-4">
      <div>
        <label className={labelCls}>Titel</label>
        <input
          value={draft.title}
          onChange={(e) => set({ title: e.target.value })}
          placeholder="Wie heißt die Idee?"
          className={inputCls}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Art</label>
          <div className="flex flex-wrap gap-1.5">
            {IDEA_KINDS.map((k) => (
              <button key={k.value} type="button" onClick={() => set({ kind: k.value })} className={chipCls(draft.kind === k.value)}>
                {k.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className={labelCls}>Stand</label>
          <div className="flex flex-wrap gap-1.5">
            {IDEA_STATUS.map((s) => (
              <button key={s.value} type="button" onClick={() => set({ status: s.value })} className={chipCls(draft.status === s.value)}>
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div>
        <label className={labelCls}>Idee — tippen oder sprechen</label>
        <SpeakField value={draft.idea} onChange={(v) => set({ idea: v })} rows={3} placeholder="Was ist die Idee?" />
      </div>

      <div>
        <label className={labelCls}>Geschichte — tippen oder sprechen</label>
        <SpeakField value={draft.story} onChange={(v) => set({ story: v })} rows={6} placeholder="Erzähl sie hier aus — oder sprich sie ein." />
      </div>

      <div>
        <label className={labelCls}>Die dazugehörigen Menschen</label>
        <PeoplePicker value={draft.people || []} onChange={(people) => set({ people })} />
      </div>

      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <label className={cn(labelCls, "mb-0")}>Prompt — tippen oder sprechen</label>
          <button type="button" onClick={writePrompt} disabled={writing} className={btnCls}>
            {writing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Prompt aus der Idee
          </button>
        </div>
        <SpeakField value={draft.prompt} onChange={(v) => set({ prompt: v })} rows={4} placeholder="Der Prompt, wie ich die Idee verstanden habe." />
      </div>

      <div>
        <label className={labelCls}>Bilder</label>
        <IdeaImages value={draft.images || []} onChange={(images) => set({ images })} />
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1">
        <button onClick={save} disabled={saving || !draft.title.trim()} className={btnAccentCls}>
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Speichern
        </button>
        <button onClick={onCancel} className={btnCls}>Abbrechen</button>
        {idea?.id && (
          <button
            onClick={remove}
            className="ml-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-destructive/15 text-destructive text-[13px] font-bold"
          >
            <Trash2 className="w-3.5 h-3.5" /> Wegnehmen
          </button>
        )}
      </div>
    </div>
  );
}