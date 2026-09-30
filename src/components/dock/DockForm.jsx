import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { FileUp, Loader2, Sparkles, X } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { PERSONA_MODES } from "@/lib/personaPrompts";
import { BLEND_OPTIONS, PERSONA_TYPES, createCreatorFromDock } from "@/lib/dock";

const inputCls =
  "w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50";

const BLEND_KEY = { ARTANIS: "artanis", TRIANIA: "triania", COUPLE: "couple" };

// Reinlegen, mischen, andocken — alles, was jemand mitbringt.
export default function DockForm({ onDone }) {
  const { toast } = useToast();
  const fileRef = useRef(null);
  const avatarRef = useRef(null);

  const [text, setText] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [avatar, setAvatar] = useState("");
  const [personaType, setPersonaType] = useState("SOLO_FEMALE");
  const [blendWith, setBlendWith] = useState("COUPLE");
  const [blendStrength, setBlendStrength] = useState(60);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);

  const uploadFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const res = await base44.integrations.Core.UploadPublicFile({ file });
      setFileUrl(res.file_url);
      setFileName(file.name);
      if (file.type?.startsWith("image/") && !avatar) setAvatar(res.file_url);
    } catch (err) {
      toast({ title: "Datei kam nicht an", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const uploadAvatar = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const res = await base44.integrations.Core.UploadPublicFile({ file });
      setAvatar(res.file_url);
    } catch (err) {
      toast({ title: "Bild kam nicht an", description: err.message, variant: "destructive" });
    }
  };

  // Erst lesen und mischen, dann zeigen — nichts wird blind übernommen.
  const analyze = async () => {
    if (!text.trim() && !fileUrl && !sourceUrl.trim()) {
      toast({ title: "Noch nichts drin", description: "Füg Text ein, leg eine Datei rein oder gib einen Link an.", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      const key = BLEND_KEY[blendWith];
      const res = await base44.functions.invoke("dockCharacter", {
        text,
        sourceUrl,
        fileUrl,
        personaText: key ? PERSONA_MODES[key].prompt : "",
        personaLabel: BLEND_OPTIONS.find((b) => b.id === blendWith)?.label || "",
        blendStrength,
      });
      if (res.data?.error) throw new Error(res.data.error);
      setResult({ ...res.data.character, tags: res.data.character?.tags || [] });
    } catch (e) {
      toast({ title: "Hat nicht geklappt", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!result?.name?.trim()) return;
    setBusy(true);
    try {
      const me = await base44.auth.me();
      const isAdmin = me?.role === "admin";
      const dock = await base44.entities.Dock.create({
        name: result.name.trim(),
        tagline: result.tagline || "",
        summary: result.summary || "",
        personality: result.personality || "",
        appearance: result.appearance || "",
        greeting: result.greeting || "",
        personaPrompt: result.personaPrompt || "",
        personaType,
        blendWith,
        blendStrength,
        rawInput: text.slice(0, 20000),
        sourceUrl,
        fileUrl,
        avatar,
        tags: result.tags || [],
        submittedByName: me?.full_name || me?.email || "",
        status: isAdmin ? "APPROVED" : "PENDING",
      });
      if (isAdmin) await createCreatorFromDock(dock);
      toast({
        title: isAdmin ? "Angedockt — läuft" : "Eingereicht",
        description: isAdmin ? "Der Charakter ist ab jetzt im Chat wählbar." : "Wir schauen drüber und geben ihn frei.",
      });
      setText(""); setSourceUrl(""); setFileUrl(""); setFileName(""); setAvatar(""); setResult(null);
      onDone?.();
    } catch (e) {
      toast({ title: "Nicht gespeichert", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="font-display text-xl text-foreground mb-1">Reinlegen</h2>
      <p className="text-xs text-muted-foreground mb-4">
        Beschreibung reinkopieren, Datei reinlegen oder einen Link angeben — alles, was du hast. Wir lesen es aus und mischen
        unsere Persönlichkeit dazu.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder="Beschreibung, Charakterkarte, Wesen, Vorgeschichte — einfach reinkopieren …"
        className={cn(inputCls, "resize-y mb-3")}
      />

      <div className="flex flex-wrap gap-2 mb-3">
        <input ref={fileRef} type="file" onChange={uploadFile} className="hidden" />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-elevated border border-border text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
          {fileName || "Datei reinlegen"}
        </button>
        {fileName && (
          <button onClick={() => { setFileUrl(""); setFileName(""); }} className="px-3 py-2.5 rounded-full bg-destructive/15 text-destructive text-sm">
            <X className="w-4 h-4" />
          </button>
        )}
        <input
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder="oder ein Link von woanders"
          className={cn(inputCls, "flex-1 min-w-[220px]")}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Das ist ein</p>
          <div className="flex flex-wrap gap-1.5">
            {PERSONA_TYPES.map((t) => (
              <button
                key={t.id}
                onClick={() => setPersonaType(t.id)}
                className={cn("px-3 py-1.5 rounded-full text-xs font-semibold transition-colors", personaType === t.id ? "bg-primary text-primary-foreground" : "bg-elevated border border-border text-muted-foreground hover:text-foreground")}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Bild (optional)</p>
          <div className="flex items-center gap-2">
            {avatar && <Image src={avatar} fittingType="fill" className="w-10 h-10 rounded-xl" />}
            <input ref={avatarRef} type="file" accept="image/*" onChange={uploadAvatar} className="hidden" />
            <button onClick={() => avatarRef.current?.click()} className="px-4 py-2.5 rounded-full bg-elevated border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
              Bild wählen
            </button>
          </div>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Unsere Persönlichkeit dazu</p>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {BLEND_OPTIONS.map((b) => (
            <button
              key={b.id}
              onClick={() => setBlendWith(b.id)}
              className={cn("p-3 rounded-xl border text-left transition-colors", blendWith === b.id ? "border-primary bg-primary/10" : "border-border bg-elevated hover:border-primary/40")}
            >
              <p className="text-sm font-semibold text-foreground">{b.label}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">{b.hint}</p>
            </button>
          ))}
        </div>
        {blendWith !== "NONE" && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
              <span>Sein Charakter</span>
              <span className="text-foreground font-semibold">{blendStrength} % unsere Persönlichkeit</span>
              <span>Unsere</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={blendStrength}
              onChange={(e) => setBlendStrength(Number(e.target.value))}
              className="w-full accent-[hsl(var(--primary))]"
            />
          </div>
        )}
      </div>

      {!result ? (
        <button
          onClick={analyze}
          disabled={busy}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {busy ? "Wird gelesen und gemischt …" : "Lesen & mischen"}
        </button>
      ) : (
        <div className="border-t border-border pt-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">So sieht er aus — du kannst alles ändern</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input value={result.name || ""} onChange={(e) => setResult({ ...result, name: e.target.value })} placeholder="Name" className={inputCls} />
            <input value={result.tagline || ""} onChange={(e) => setResult({ ...result, tagline: e.target.value })} placeholder="Ein Satz zu ihm" className={inputCls} />
          </div>
          <textarea value={result.greeting || ""} onChange={(e) => setResult({ ...result, greeting: e.target.value })} rows={2} placeholder="Der erste Satz, mit dem er dich begrüßt" className={cn(inputCls, "resize-y")} />
          <textarea value={result.personality || ""} onChange={(e) => setResult({ ...result, personality: e.target.value })} rows={3} placeholder="Wesen" className={cn(inputCls, "resize-y")} />
          <input
            value={(result.tags || []).join(", ")}
            onChange={(e) => setResult({ ...result, tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
            placeholder="Schlagworte, mit Komma getrennt"
            className={inputCls}
          />
          <details className="rounded-xl bg-elevated border border-border p-3">
            <summary className="text-xs font-semibold text-muted-foreground cursor-pointer">Die fertige Anweisung ansehen</summary>
            <textarea value={result.personaPrompt || ""} onChange={(e) => setResult({ ...result, personaPrompt: e.target.value })} rows={10} className={cn(inputCls, "resize-y mt-3")} />
          </details>
          <div className="flex gap-2">
            <button onClick={submit} disabled={busy || !result.name?.trim()} className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Andocken
            </button>
            <button onClick={() => setResult(null)} className="px-5 py-3 rounded-full bg-elevated border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
              Zurück
            </button>
          </div>
        </div>
      )}
    </div>
  );
}