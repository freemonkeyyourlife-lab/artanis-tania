import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Mic, Square, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BASE_VOICES, MOODS } from "@/lib/voiceDj";
import VoicePreviewButton from "@/components/voice/VoicePreviewButton";

const input = "w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50";

// Das Modul: eine Stimme einsprechen oder hochladen — und mit den Reglern
// zur passenden Stimme machen.
export default function VoiceForm({ initial, onSaved, onCancel }) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    description: initial?.description || "",
    baseVoice: initial?.baseVoice || "honey",
    mood: initial?.mood || "NEUTRAL",
    speed: initial?.speed ?? 1,
    depth: initial?.depth ?? 0,
    tags: initial?.tags || [],
    ownerName: initial?.ownerName || "",
    active: initial?.active !== false,
    public: initial?.public !== false,
    priceCoins: initial?.priceCoins ?? 0,
    sampleFile: initial?.sampleFile || "",
  });
  const [tagInput, setTagInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const applyMood = (mood) => setForm((prev) => ({ ...prev, mood: mood.id, speed: mood.speed, depth: mood.depth }));

  const uploadSample = async (blob) => {
    setBusy(true);
    try {
      const file = new File([blob], "stimme.webm", { type: "audio/webm" });
      const up = await base44.integrations.Core.UploadPrivateFile({ file });
      set("sampleFile", up.file_uri);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const toggleRecord = async () => {
    if (recording) { recorderRef.current?.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(false);
        await uploadSample(new Blob(chunksRef.current, { type: "audio/webm" }));
      };
      recorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch (e) {
      console.error(e);
    }
  };

  const playSample = async () => {
    try {
      const res = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: form.sampleFile, expires_in: 600 });
      if (res?.signed_url) new Audio(res.signed_url).play();
    } catch (e) {
      console.error(e);
    }
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    set("tags", [...form.tags, t]);
    setTagInput("");
  };

  const save = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (initial?.id) await base44.entities.Voice.update(initial.id, form);
      else await base44.entities.Voice.create(form);
      onSaved();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Name der Stimme</label>
          <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="z. B. Rauchig dunkel" className={input} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Wem gehört sie?</label>
          <input value={form.ownerName} onChange={(e) => set("ownerName", e.target.value)} placeholder="z. B. Triania oder ein Nutzer" className={input} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Beschreibung</label>
        <input value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Wie klingt sie, wofür passt sie?" className={input} />
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Grundstimme</p>
        <div className="flex flex-wrap gap-2">
          {BASE_VOICES.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => set("baseVoice", v.id)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-semibold border transition-colors",
                form.baseVoice === v.id ? "bg-primary text-primary-foreground border-primary" : "bg-elevated border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {v.label} <span className="font-normal opacity-70">· {v.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground mb-2">Stimm-DJ — eine Stimmung, alles stellt sich passend ein</p>
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => applyMood(m)}
              className={cn(
                "px-4 py-2 rounded-full text-xs font-semibold border transition-colors",
                form.mood === m.id ? "bg-primary/20 border-primary text-primary" : "bg-elevated border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Tempo — {form.speed.toFixed(2)}×</label>
          <input type="range" min="0.7" max="1.4" step="0.02" value={form.speed} onChange={(e) => set("speed", Number(e.target.value))} className="w-full accent-[hsl(var(--primary))]" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Tiefe — {form.depth > 0 ? "+" : ""}{form.depth}</label>
          <input type="range" min="-40" max="20" step="2" value={form.depth} onChange={(e) => set("depth", Number(e.target.value))} className="w-full accent-[hsl(var(--primary))]" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <VoicePreviewButton profile={form} />
        <button
          type="button"
          onClick={toggleRecord}
          disabled={busy}
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors disabled:opacity-50",
            recording ? "bg-red-500 text-white animate-pulse" : "bg-elevated border border-border text-muted-foreground hover:text-foreground"
          )}
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : recording ? <Square className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
          {busy ? "Lädt …" : recording ? "Aufnahme stoppen" : "Stimme einsprechen"}
        </button>
        {form.sampleFile && (
          <>
            <button type="button" onClick={playSample} className="text-xs text-primary hover:underline">Aufnahme anhören</button>
            <button type="button" onClick={() => set("sampleFile", "")} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <Trash2 className="w-3.5 h-3.5" /> Aufnahme weg
            </button>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Schlagworte</label>
          <div className="flex gap-2">
            <input value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTag()} placeholder="z. B. rauchig" className={input} />
            <button type="button" onClick={addTag} className="w-11 rounded-xl bg-elevated border border-border text-muted-foreground hover:text-foreground">+</button>
          </div>
          {form.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {form.tags.map((t) => (
                <button key={t} type="button" onClick={() => set("tags", form.tags.filter((x) => x !== t))} className="px-2.5 py-1 rounded-full bg-elevated border border-border text-[11px] text-muted-foreground hover:text-foreground">
                  {t} ×
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Preis in Coins (0 = gratis)</label>
          <input type="number" min="0" value={form.priceCoins} onChange={(e) => set("priceCoins", Number(e.target.value))} className={input} />
        </div>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} className="accent-[hsl(var(--primary))]" /> Aktiv
        </label>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={form.public} onChange={(e) => set("public", e.target.checked)} className="accent-[hsl(var(--primary))]" /> Andere dürfen sie nutzen
        </label>
      </div>

      <div className="flex gap-3">
        <button onClick={save} disabled={saving || !form.name.trim()} className="px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
          {saving ? "Speichert …" : "Stimme speichern"}
        </button>
        <button onClick={onCancel} className="px-6 py-2.5 rounded-full bg-elevated border border-border text-sm text-muted-foreground hover:text-foreground">Abbrechen</button>
      </div>
    </div>
  );
}