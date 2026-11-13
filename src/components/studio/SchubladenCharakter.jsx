import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Image } from "@/components/ui/image";
import { Loader2, Upload, Plus, Check, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

// Schritt 1 der Studio-Schublade: eine Figur schnell anlegen — Name, Alter,
// Aussehen, Beschreibung und ein Foto. Speicherort wählbar: für mich,
// für alle oder nur für diesen Chat (dann wird nicht gespeichert).

const SCOPES = [
  { id: "me", label: "Für mich", hint: "Nur in deinem Studio" },
  { id: "all", label: "Für alle", hint: "Im Katalog für alle bereitgestellt" },
  { id: "chat", label: "Nur Chat", hint: "Nicht gespeichert — nur hier verfügbar" },
];

export default function SchubladenCharakter({ onCreated }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [appearance, setAppearance] = useState("");
  const [description, setDescription] = useState("");
  const [avatar, setAvatar] = useState("");
  const [scope, setScope] = useState("me");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(null);

  const uploadAvatar = async (file) => {
    if (!file) return;
    setUploading(true);
    try {
      const r = await base44.integrations.Core.UploadPublicFile({ file });
      if (r?.file_url) setAvatar(r.file_url);
    } catch (e) {
      toast({ variant: "destructive", title: "Upload fehlgeschlagen", description: e?.message });
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (busy) return;
    const n = name.trim();
    const a = Number(age);
    if (!n) {
      toast({ variant: "destructive", title: "Name fehlt" });
      return;
    }
    if (!a || a < 18) {
      toast({ variant: "destructive", title: "Alter muss mindestens 18 sein" });
      return;
    }
    setBusy(true);
    try {
      if (scope === "chat") {
        const draft = { name: n, adultAge: a, appearance, description, avatar, _local: true };
        try {
          const arr = JSON.parse(localStorage.getItem("schublade_char_drafts") || "[]");
          arr.push(draft);
          localStorage.setItem("schublade_char_drafts", JSON.stringify(arr));
        } catch {}
        setDone({ name: n, local: true });
        toast({ title: "Figur für diesen Chat bereit", description: "Nicht gespeichert — nur lokal." });
      } else {
        const created = await base44.entities.Character.create({
          name: n,
          adultAge: a,
          appearance,
          description,
          avatar,
          shared: scope === "all",
        });
        setDone({ name: n, id: created.id, local: false });
        toast({
          title: "Figur angelegt",
          description: scope === "all" ? "Für alle bereitgestellt." : "In deinem Studio gespeichert.",
        });
      }
      if (onCreated) onCreated();
    } catch (e) {
      toast({ variant: "destructive", title: "Speichern fehlgeschlagen", description: e?.message });
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setName("");
    setAge("");
    setAppearance("");
    setDescription("");
    setAvatar("");
    setDone(null);
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-primary/30 bg-card p-4 text-center">
        <Check className="w-5 h-5 text-primary mx-auto mb-2" />
        <p className="font-bold text-foreground">{done.name} ist bereit.</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {done.local ? "Nur für diesen Chat — nicht gespeichert." : "Gespeichert im Figur-Studio."}
        </p>
        <div className="flex gap-2 mt-3 justify-center">
          {!done.local && done.id && (
            <a
              href={`/charakter/${done.id}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[12px] font-bold"
            >
              <ExternalLink className="w-3 h-3" /> Ansehen
            </a>
          )}
          <button
            onClick={reset}
            className="px-3 py-1.5 rounded-full bg-elevated text-foreground text-[12px] font-bold"
          >
            Nächste Figur
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <p className="font-display text-base text-foreground">Figur schnell anlegen</p>

      <div className="flex items-center gap-3">
        <label className="relative w-16 h-16 rounded-2xl border-2 border-border bg-elevated overflow-hidden flex items-center justify-center cursor-pointer flex-shrink-0">
          {avatar ? (
            <Image src={avatar} fittingType="fill" className="w-full h-full" />
          ) : uploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : (
            <Upload className="w-4 h-4 text-muted-foreground" />
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => uploadAvatar(e.target.files?.[0])}
          />
        </label>
        <div className="flex-1 space-y-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="w-full rounded-xl bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
          />
          <input
            value={age}
            onChange={(e) => setAge(e.target.value)}
            type="number"
            min={18}
            placeholder="Alter (18+)"
            className="w-full rounded-xl bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
          />
        </div>
      </div>

      <input
        value={appearance}
        onChange={(e) => setAppearance(e.target.value)}
        placeholder="Aussehen — z. B. Haarfarbe, Figur, Stil"
        className="w-full rounded-xl bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Kurze Beschreibung / Charakter"
        rows={2}
        className="w-full rounded-xl bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
      />

      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Speichern für</p>
        <div className="flex gap-1.5">
          {SCOPES.map((s) => (
            <button
              key={s.id}
              onClick={() => setScope(s.id)}
              title={s.hint}
              className={cn(
                "flex-1 rounded-full px-2 py-1.5 text-[11px] font-bold transition-colors",
                scope === s.id ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">{SCOPES.find((s) => s.id === scope)?.hint}</p>
      </div>

      <button
        onClick={save}
        disabled={busy}
        className="glass-btn glass-btn-accent w-full inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        Figur anlegen
      </button>
    </div>
  );
}