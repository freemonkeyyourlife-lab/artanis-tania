import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Eye, Save, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import VoiceTextArea from "@/components/voice/SpeakField";

// Die Kulisse: das, was die User von der Figur sehen. Steht direkt an der Figur.
export default function KulissePublic({ character, onSaved }) {
  const { toast } = useToast();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm({
      tagline: character.tagline || "",
      shortStory: character.shortStory || "",
      bio: character.bio || "",
    });
  }, [character.id]);

  if (!form) return null;

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setBusy(true);
    try {
      await base44.entities.Character.update(character.id, form);
      toast({ title: "Kulisse gespeichert" });
      onSaved?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass rounded-2xl border-2 border-border p-5">
      <div className="flex items-center gap-2 mb-1">
        <Eye className="w-5 h-5 text-primary" />
        <h2 className="text-[17px] font-bold text-foreground">Die Kulisse</h2>
      </div>
      <p className="text-[13px] font-semibold text-muted-foreground mb-4 leading-relaxed">
        Das sieht jeder. Was hier steht, ist die Bühne — der Rest bleibt dahinter.
      </p>

      <div className="space-y-4">
        <div>
          <span className="block text-[12px] font-bold text-muted-foreground mb-1.5">In einem Satz</span>
          <VoiceTextArea value={form.tagline} onChange={set("tagline")} rows={2} placeholder="Wie man sie in einem Satz beschreiben würde." />
        </div>
        <div>
          <span className="block text-[12px] font-bold text-muted-foreground mb-1.5">Kurze Geschichte</span>
          <VoiceTextArea value={form.shortStory} onChange={set("shortStory")} rows={4} placeholder="Was der Gast über sie erfährt." />
        </div>
        <div>
          <span className="block text-[12px] font-bold text-muted-foreground mb-1.5">Über sie</span>
          <VoiceTextArea value={form.bio} onChange={set("bio")} rows={5} placeholder="Die ausführliche Fassung fürs Profil." />
        </div>
      </div>

      <button
        onClick={save}
        disabled={busy}
        className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn glass-btn-accent text-[14px] font-bold text-gloss disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Kulisse speichern
      </button>
    </div>
  );
}