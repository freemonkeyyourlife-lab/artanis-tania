import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { useToast } from "@/components/ui/use-toast";
import VoiceInput from "@/components/VoiceInput";
import { Loader2, Plus, Trash2, Upload, Wand2, Mic } from "lucide-react";

// Charakter-Fabrik: ein geführtes Formular, um eigene Charaktere anzulegen —
// mit Stimme, Beispielen/Vorlagen (tippen oder einsprechen) und Referenzbildern.
// Gespeichert wird als Character + verknüpfte CharacterModule (Beispiele).

const signUri = async (u) => {
  if (!u) return null;
  if (u.startsWith("http")) return u;
  try {
    const r = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: u });
    return r?.signed_url || null;
  } catch { return null; }
};

export default function FabrikForm({ onCreated }) {
  const { toast } = useToast();
  const [voices, setVoices] = useState([]);
  const [name, setName] = useState("");
  const [age, setAge] = useState(25);
  const [appearance, setAppearance] = useState("");
  const [behavior, setBehavior] = useState("");
  const [personality, setPersonality] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [baseVoice, setBaseVoice] = useState("honey");
  const [examples, setExamples] = useState([]); // {text}
  const [exDraft, setExDraft] = useState("");
  const [refs, setRefs] = useState([]); // {uri, url}
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    base44.entities.Voice.filter({ active: true }, "-created_date", 60)
      .then((r) => setVoices(Array.isArray(r) ? r : []))
      .catch(() => setVoices([]));
  }, []);

  const addRef = async (file) => {
    if (!file) return;
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      const url = await signUri(file_uri);
      setRefs((r) => [...r, { uri: file_uri, url }]);
    } catch (e) {
      toast({ variant: "destructive", title: "Upload fehlgeschlagen", description: e?.message });
    }
  };

  const addExample = (text) => {
    const t = (text ?? exDraft).trim();
    if (!t) return;
    setExamples((e) => [...e, { text: t }]);
    setExDraft("");
  };

  const save = async () => {
    if (!name.trim()) { toast({ variant: "destructive", title: "Name fehlt" }); return; }
    if (age < 18) { toast({ variant: "destructive", title: "Mindestens 18" }); return; }
    setSaving(true);
    try {
      const refUris = refs.map((r) => r.uri);
      const char = await base44.entities.Character.create({
        name: name.trim(),
        adultAge: Number(age),
        appearance, behavior, personality,
        voiceId: voiceId || undefined,
        voice: baseVoice,
        images: refUris,
        avatar: refUris[0] || undefined,
        fictional: true,
        sourceConsentVerified: true,
        createdByRole: "DAVID",
      });
      const moduleIds = [];
      for (const ex of examples) {
        const m = await base44.entities.CharacterModule.create({
          title: ex.text.slice(0, 40) || "Beispiel",
          kind: "SITUATION",
          text: ex.text,
          characterId: char.id,
          source: "EIGEN",
          active: true,
        });
        moduleIds.push(m.id);
      }
      if (moduleIds.length) {
        await base44.entities.Character.update(char.id, { moduleIds });
      }
      toast({ title: "Charakter angelegt", description: name.trim() });
      onCreated?.({ ...char, moduleIds });
      // Reset
      setName(""); setAge(25); setAppearance(""); setBehavior(""); setPersonality("");
      setVoiceId(""); setBaseVoice("honey"); setExamples([]); setRefs([]);
    } catch (e) {
      toast({ variant: "destructive", title: "Speichern fehlgeschlagen", description: e?.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h3 className="font-display text-xl text-foreground flex items-center gap-2 mb-1">
        <Wand2 className="w-5 h-5 text-primary" /> Charakter-Fabrik
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Lege deine eigenen Charaktere an — mit Stimme, Beispielen und Referenzbildern. Bleiben deine Privatexemplare.
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground" placeholder="z. B. Mira" />
        </label>
        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Alter (≥18)</span>
          <input type="number" min={18} value={age} onChange={(e) => setAge(e.target.value)} className="mt-1 w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground" />
        </label>
        <label className="block md:col-span-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Aussehen</span>
          <textarea value={appearance} onChange={(e) => setAppearance(e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground" />
        </label>
        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Verhalten</span>
          <textarea value={behavior} onChange={(e) => setBehavior(e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground" />
        </label>
        <label className="block">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Persönlichkeit</span>
          <textarea value={personality} onChange={(e) => setPersonality(e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground" />
        </label>
      </div>

      {/* Stimme */}
      <div className="mt-4 rounded-xl border border-border bg-background p-3">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5"><Mic className="w-3.5 h-3.5" /> Stimme</p>
        <div className="flex flex-col sm:flex-row gap-2">
          <select value={voiceId} onChange={(e) => setVoiceId(e.target.value)} className="flex-1 rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground">
            <option value="">Keine (nur Grundstimme)</option>
            {voices.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
          </select>
          <select value={baseVoice} onChange={(e) => setBaseVoice(e.target.value)} className="rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground">
            {["river", "honey", "sunny", "storm", "spark"].map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
      </div>

      {/* Beispiele / Vorlagen */}
      <div className="mt-4 rounded-xl border border-border bg-background p-3">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Beispiele & Vorlagen</p>
        <div className="flex gap-2">
          <input value={exDraft} onChange={(e) => setExDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addExample()} placeholder="Beispiel oder Vorlage eintippen …" className="flex-1 rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground" />
          <VoiceInput onResult={(t) => addExample(t)} title="Beispiel einsprechen" />
          <button onClick={() => addExample()} disabled={!exDraft.trim()} className="glass-btn glass-btn-accent inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-bold disabled:opacity-50"><Plus className="w-4 h-4" /></button>
        </div>
        {examples.length > 0 && (
          <ul className="mt-2 space-y-1">
            {examples.map((ex, i) => (
              <li key={i} className="flex items-start gap-2 rounded-lg bg-elevated p-2 text-sm text-foreground">
                <span className="flex-1">{ex.text}</span>
                <button onClick={() => setExamples((e) => e.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-destructive"><Trash2 className="w-3.5 h-3.5" /></button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Referenzbilder */}
      <div className="mt-4 rounded-xl border border-border bg-background p-3">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Referenzbilder</p>
        <div className="flex flex-wrap gap-2">
          {refs.map((r, i) => (
            <div key={i} className="relative h-20 w-20 overflow-hidden rounded-lg border border-border bg-elevated">
              {r.url && <Image src={r.url} fittingType="fill" className="h-full w-full" />}
              <button onClick={() => setRefs((rs) => rs.filter((_, j) => j !== i))} className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white hover:bg-destructive"><Trash2 className="w-3 h-3" /></button>
            </div>
          ))}
          <button onClick={() => fileRef.current?.click()} className="glass-btn flex h-20 w-20 flex-col items-center justify-center rounded-lg text-[11px] text-muted-foreground">
            <Upload className="w-4 h-4 mb-1" /> Hochladen
          </button>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { Array.from(e.target.files || []).forEach(addRef); e.target.value = ""; }} />
        </div>
        <p className="mt-2 text-[10px] text-muted-foreground">Bilder werden gespeichert (stored privately) — nur für dich.</p>
      </div>

      <button onClick={save} disabled={saving || !name.trim()} className="glass-btn glass-btn-accent mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold disabled:opacity-50">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />} Charakter anlegen
      </button>
    </div>
  );
}