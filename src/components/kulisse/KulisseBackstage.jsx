import React, { useEffect, useState } from "react";
import { Lock, Save, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import VoiceTextArea from "@/components/voice/VoiceTextArea";
import { BACKSTAGE_FIELDS, EMPTY_BACKSTAGE, loadBackstage, saveBackstage } from "@/lib/kulisse";

// Hinter den Kulissen: was nur wir sehen. Hier steht, was die Figur wirklich ist.
export default function KulisseBackstage({ character }) {
  const { toast } = useToast();
  const [form, setForm] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setForm(null);
    loadBackstage(character.id).then((rec) => setForm(rec || { ...EMPTY_BACKSTAGE }));
  }, [character.id]);

  if (!form) {
    return (
      <div className="glass rounded-2xl border-2 border-border p-5 flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-[13px] font-semibold">Wird geladen…</span>
      </div>
    );
  }

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setBusy(true);
    try {
      const rec = await saveBackstage(character, form);
      setForm(rec);
      toast({ title: "Hinter den Kulissen gespeichert" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass rounded-2xl border-2 border-primary/40 p-5">
      <div className="flex items-center gap-2 mb-1">
        <Lock className="w-5 h-5 text-primary" />
        <h2 className="text-[17px] font-bold text-foreground">Hinter den Kulissen</h2>
      </div>
      <p className="text-[13px] font-semibold text-muted-foreground mb-4 leading-relaxed">
        Das sieht niemand außer dir. Je mehr hier steht, desto besser verstehe ich, wen du meinst.
      </p>

      <div className="space-y-4">
        {BACKSTAGE_FIELDS.map((f) => (
          <div key={f.key}>
            <span className="block text-[12px] font-bold text-foreground mb-1">{f.label}</span>
            <span className="block text-[12px] font-semibold text-muted-foreground mb-1.5">{f.hint}</span>
            <VoiceTextArea value={form[f.key] || ""} onChange={set(f.key)} rows={3} />
          </div>
        ))}
        <div>
          <span className="block text-[12px] font-bold text-foreground mb-1">Ausgangsbild</span>
          <span className="block text-[12px] font-semibold text-muted-foreground mb-1.5">
            Der Link zum Referenzbild. Von hier aus wird sie nach links und rechts gewandelt.
          </span>
          <input
            value={form.refImage || ""}
            onChange={(e) => set("refImage")(e.target.value)}
            placeholder="https://…"
            className="w-full rounded-xl bg-background border border-border px-3 py-2 text-[13px] font-semibold text-foreground"
          />
        </div>
      </div>

      <button
        onClick={save}
        disabled={busy}
        className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn glass-btn-accent text-[14px] font-bold text-gloss disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Hinter den Kulissen speichern
      </button>
    </div>
  );
}