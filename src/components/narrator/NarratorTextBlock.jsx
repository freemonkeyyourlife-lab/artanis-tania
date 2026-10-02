import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Check, Loader2, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BETWEEN_LINES, RECALL_LINES, RECALL_TIPS } from "@/lib/introStory";
import LineListEditor from "@/components/narrator/LineListEditor";
import VoiceTextArea from "@/components/voice/VoiceTextArea";
import { labelCls, btnCls, btnAccentCls } from "@/lib/narratorUi";

// Text: was sie sagt. {narrator} wird beim Sprechen durch ihren Namen ersetzt.
export default function NarratorTextBlock({ narrator, onSaved }) {
  const saved = narrator?.lines || {};
  const [form, setForm] = useState({
    greeting: saved.greeting || "",
    between: saved.between?.length ? saved.between : [],
    recall: saved.recall?.length ? saved.recall : [],
    tips: saved.tips?.length ? saved.tips : [],
  });
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  const fillDefaults = () =>
    set({
      between: form.between.length ? form.between : BETWEEN_LINES,
      recall: form.recall.length ? form.recall : RECALL_LINES,
      tips: form.tips.length ? form.tips : RECALL_TIPS,
    });

  const save = async () => {
    setBusy(true);
    setNote("");
    try {
      const rec = await base44.entities.Narrator.update(narrator.id, { lines: form });
      onSaved?.(rec);
      setNote("Gespeichert.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <label className={labelCls}>
        Begrüßung <span className="font-semibold normal-case tracking-normal opacity-70">der erste Satz, wenn sie kommt</span>
      </label>
      <VoiceTextArea
        value={form.greeting}
        onChange={(greeting) => set({ greeting })}
        rows={3}
        placeholder="Ich hab schon auf dich gewartet. Wir werden eine Menge Spaß haben."
      />

      <LineListEditor
        label="Zwischenrufe"
        hint="damit meldet sie sich von selbst"
        lines={form.between}
        onChange={(between) => set({ between })}
        placeholder="Und? Wie gefällt es dir bisher?"
      />
      <LineListEditor
        label="Rückruf"
        hint="wenn du sie antippst"
        lines={form.recall}
        onChange={(recall) => set({ recall })}
        placeholder="Ich bin da. Was brauchst du?"
      />
      <LineListEditor
        label="Ihre Tipps"
        hint="was sie dir zeigt"
        lines={form.tips}
        onChange={(tips) => set({ tips })}
        placeholder="Oben auf das i — da steht die Erklärung zu dieser Stelle."
      />

      <div className="flex flex-wrap items-center gap-2 mt-4">
        <button onClick={save} disabled={busy} className={btnAccentCls}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Speichern
        </button>
        <button onClick={fillDefaults} className={btnCls}>
          <Wand2 className="w-4 h-4" /> Vorschläge einsetzen
        </button>
        {note && <span className="text-[12px] font-semibold text-muted-foreground">{note}</span>}
      </div>
    </div>
  );
}