import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Check, Loader2, Mic, Sparkles, Square, Trash2, Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { BASE_VOICES, MOODS } from "@/lib/voiceDj";
import VoicePreviewButton from "@/components/voice/VoicePreviewButton";
import HelpButton from "@/components/HelpButton";

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
    intensity: initial?.intensity ?? 50,
    ending: initial?.ending ?? 50,
    tags: initial?.tags || [],
    ownerName: initial?.ownerName || "",
    active: initial?.active !== false,
    public: initial?.public !== false,
    priceCoins: initial?.priceCoins ?? 0,
    sampleFile: initial?.sampleFile || "",
    source: initial?.source || "EINGESPROCHEN",
    provider: initial?.provider || "GRUNDSTIMME",
    externalVoiceId: initial?.externalVoiceId || "",
    originNote: initial?.originNote || "",
    favorite: initial?.favorite === true,
  });
  const [tagInput, setTagInput] = useState("");
  const [recording, setRecording] = useState(false);
  const [cloning, setCloning] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
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
      set("source", "EINGESPROCHEN");
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  // Eine fertige Aufnahme mitbringen — deine eigene oder eine, die dir jemand gibt.
  const uploadFile = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      const up = await base44.integrations.Core.UploadPrivateFile({ file });
      set("sampleFile", up.file_uri);
      set("source", "HOCHGELADEN");
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    uploadFile(event.dataTransfer?.files?.[0]);
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

  // Aus der Aufnahme eine Stimme machen, die jeden Text sprechen kann.
  const cloneVoice = async () => {
    if (!form.sampleFile) return;
    setCloning(true);
    try {
      const res = await base44.functions.invoke("elevenLabsClone", {
        fileUri: form.sampleFile,
        name: form.name.trim() || "Eigene Stimme",
        description: form.description,
      });
      if (res.data?.error) throw new Error(res.data.error);
      setForm((prev) => ({ ...prev, provider: "ELEVENLABS", externalVoiceId: res.data.voiceId }));
      toast({ title: "Stimme geklont", description: "Sie kann jetzt jeden Text sprechen." });
    } catch (e) {
      toast({ title: "Klonen hat nicht geklappt", description: e.message, variant: "destructive" });
    } finally {
      setCloning(false);
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
      // Wurde am Klang gedreht, muss die alte Hörprobe weg — sonst klingt sie noch wie vorher.
      // Nur die automatisch abgelegte Hörprobe — eine eigene Aufnahme bleibt immer erhalten.
      const retuned = initial?.id && initial.sampleCached &&
        (initial.speed !== form.speed || initial.mood !== form.mood || initial.depth !== form.depth ||
          initial.intensity !== form.intensity || initial.ending !== form.ending);
      const payload = retuned ? { ...form, sampleFile: "", sampleCached: false } : form;
      if (initial?.id) await base44.entities.Voice.update(initial.id, payload);
      else await base44.entities.Voice.create(payload);
      onSaved();
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
      <div className="flex flex-wrap gap-2">
        <HelpButton topic="stimmeBearbeiten" label="So stellst du ein" />
        <HelpButton topic="stimmeKlonen" label="So klonst du" />
      </div>
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
        <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Woher hast du sie?</label>
        <input value={form.originNote} onChange={(e) => set("originNote", e.target.value)} placeholder="z. B. selbst eingesprochen, von Kollegin X bekommen, gekauft bei …" className={input} />
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
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Tonlage — {form.depth > 0 ? "+" : ""}{form.depth}</label>
          <input type="range" min="-40" max="20" step="2" value={form.depth} onChange={(e) => set("depth", Number(e.target.value))} className="w-full accent-[hsl(var(--primary))]" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Intensität — {form.intensity} (nur ElevenLabs)</label>
          <input type="range" min="0" max="100" step="5" value={form.intensity} onChange={(e) => set("intensity", Number(e.target.value))} className="w-full accent-[hsl(var(--primary))]" />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Ausklang am Satzende — {form.ending} (nur ElevenLabs)</label>
          <input type="range" min="0" max="100" step="5" value={form.ending} onChange={(e) => set("ending", Number(e.target.value))} className="w-full accent-[hsl(var(--primary))]" />
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground -mt-2">
        Tempo und Stimmung wirken auch bei ElevenLabs-Stimmen — im Chat, in der Sprechprobe und im Video-Call.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <VoicePreviewButton profile={form} useSample={form.provider !== "ELEVENLABS"} />
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
        <input
          ref={fileRef}
          type="file"
          accept="audio/*"
          onChange={(e) => { uploadFile(e.target.files?.[0]); e.target.value = ""; }}
          className="hidden"
        />
        {form.sampleFile && (
          <>
            <button type="button" onClick={playSample} className="text-xs text-primary hover:underline">Aufnahme anhören</button>
            <button type="button" onClick={() => set("sampleFile", "")} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
              <Trash2 className="w-3.5 h-3.5" /> Aufnahme weg
            </button>
          </>
        )}
      </div>

      {/* Datei einfach hierher ziehen — oder anklicken und aussuchen. */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className={cn(
          "rounded-2xl border-2 border-dashed px-5 py-6 text-center cursor-pointer transition-colors",
          dragOver ? "border-primary bg-primary/10" : "border-border bg-elevated hover:border-primary/40"
        )}
      >
        <Upload className={cn("w-5 h-5 mx-auto", dragOver ? "text-primary" : "text-muted-foreground")} />
        <p className="text-sm text-foreground mt-2">
          {busy ? "Lädt hoch …" : dragOver ? "Loslassen — dann ist sie drin" : "Aufnahme hierher ziehen"}
        </p>
        <p className="text-[11px] text-muted-foreground mt-1">
          oder anklicken und aussuchen · mp3, wav, m4a · am besten mindestens 30 Sekunden
        </p>
      </div>

      {form.sampleFile && (
        <div className="rounded-2xl border border-border bg-elevated p-4">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={cloneVoice}
              disabled={cloning}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
            >
              {cloning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              {cloning ? "Klont …" : form.externalVoiceId ? "Neu klonen" : "Als eigene Stimme klonen"}
            </button>
            {form.provider === "ELEVENLABS" && form.externalVoiceId && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600/20 text-emerald-400 text-[11px] font-semibold">
                <Check className="w-3 h-3" /> Spricht jeden Text
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground mt-2">
            Aus der Aufnahme wird eine Stimme, die jeden Text sprechen kann — im Chat, in der Sprechprobe und im Video-Call.
            Am besten eine mp3- oder wav-Datei mit mindestens 30 Sekunden. Nur Stimmen verwenden, für die du die Erlaubnis hast.
          </p>
        </div>
      )}

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