import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Image } from "@/components/ui/image";
import { Loader2, Upload, Plus, Check, ExternalLink, Pencil, FilePlus } from "lucide-react";
import { cn } from "@/lib/utils";

// Figur in der Studio-Schublade: bestehende Figuren inline bearbeiten oder neu
// anlegen — alles ohne die Seite zu verlassen. Avatar öffentlich, damit er im
// Profil lädt.

const SCOPES = [
  { id: "me", label: "Für mich", hint: "Nur in deinem Studio" },
  { id: "all", label: "Für alle", hint: "Im Katalog für alle bereitgestellt" },
  { id: "chat", label: "Nur Chat", hint: "Nicht gespeichert — nur hier verfügbar" },
];

export default function SchubladenCharakter({ onCreated }) {
  const { toast } = useToast();
  const [mode, setMode] = useState("bearbeiten");
  const [list, setList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [appearance, setAppearance] = useState("");
  const [description, setDescription] = useState("");
  const [avatar, setAvatar] = useState("");
  const [scope, setScope] = useState("me");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(null);

  const loadList = async () => {
    setLoadingList(true);
    try {
      const items = await base44.entities.Character.list("-updated_date");
      setList(items || []);
    } catch {
      setList([]);
    } finally {
      setLoadingList(false);
    }
  };
  useEffect(() => {
    loadList();
  }, []);

  const startNew = () => {
    setEditingId(null);
    setName("");
    setAge("");
    setAppearance("");
    setDescription("");
    setAvatar("");
    setDone(null);
    setMode("neu");
  };

  const loadForEdit = (c) => {
    setEditingId(c.id);
    setName(c.name || "");
    setAge(c.adultAge ? String(c.adultAge) : "");
    setAppearance(c.appearance || "");
    setDescription(c.description || "");
    setAvatar(c.avatar || "");
    setDone(null);
    setMode("neu");
  };

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
      if (editingId) {
        await base44.entities.Character.update(editingId, { name: n, adultAge: a, appearance, description, avatar });
        setDone({ name: n, id: editingId, local: false, edited: true });
        toast({ title: "Figur gespeichert" });
        loadList();
      } else if (scope === "chat") {
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
        loadList();
      }
      if (onCreated) onCreated();
    } catch (e) {
      toast({ variant: "destructive", title: "Speichern fehlgeschlagen", description: e?.message });
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setEditingId(null);
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
        <p className="font-bold text-foreground">
          {done.edited ? "Geändert." : `${done.name} ist bereit.`}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {done.local
            ? "Nur für diesen Chat — nicht gespeichert."
            : done.edited
            ? "Änderungen gespeichert."
            : "Gespeichert im Figur-Studio."}
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
            onClick={done.edited ? () => setMode("bearbeiten") : reset}
            className="px-3 py-1.5 rounded-full bg-elevated text-foreground text-[12px] font-bold"
          >
            {done.edited ? "Zur Liste" : "Nächste Figur"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-1 p-1 rounded-full bg-elevated">
        <button
          onClick={() => { setMode("bearbeiten"); setEditingId(null); }}
          className={cn(
            "flex-1 rounded-full px-3 py-1.5 text-[12px] font-bold",
            mode === "bearbeiten" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Bearbeiten
        </button>
        <button
          onClick={startNew}
          className={cn(
            "flex-1 rounded-full px-3 py-1.5 text-[12px] font-bold",
            mode === "neu" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          Neu anlegen
        </button>
      </div>

      {mode === "bearbeiten" && !editingId && (
        <div className="rounded-2xl border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground mb-2">
            Figur zum Bearbeiten wählen — bleibt auf dieser Seite.
          </p>
          {loadingList ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : list.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">Noch keine Figuren.</p>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-hide">
              {list.map((c) => (
                <button
                  key={c.id}
                  onClick={() => loadForEdit(c)}
                  className="w-full flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-white/5 text-left"
                >
                  {c.avatar ? (
                    <Image src={c.avatar} fittingType="fill" className="w-8 h-8 rounded-full flex-shrink-0" />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-elevated flex items-center justify-center text-[11px] font-bold text-primary flex-shrink-0">
                      {c.name?.[0]}
                    </span>
                  )}
                  <span className="flex-1 text-[12px] font-semibold text-foreground truncate">{c.name}</span>
                  <Pencil className="w-3 h-3 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
          <button
            onClick={startNew}
            className="mt-2 w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-elevated px-3 py-1.5 text-[11px] font-bold text-muted-foreground hover:text-foreground"
          >
            <FilePlus className="w-3.5 h-3.5" /> Neue Figur
          </button>
        </div>
      )}

      {mode === "neu" && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          {editingId && (
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">
              Bearbeite: {name}
            </p>
          )}
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

          {!editingId && (
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
          )}

          <div className="flex gap-2">
            {editingId && (
              <button
                onClick={() => { setEditingId(null); setMode("bearbeiten"); reset(); }}
                className="px-3 rounded-full bg-elevated text-foreground text-[12px] font-bold"
              >
                Abbrechen
              </button>
            )}
            <button
              onClick={save}
              disabled={busy}
              className="glass-btn glass-btn-accent flex-1 inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {editingId ? "Änderungen speichern" : "Figur anlegen"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}