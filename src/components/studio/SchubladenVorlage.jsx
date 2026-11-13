import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Check, Pencil, FilePlus } from "lucide-react";
import { cn } from "@/lib/utils";

// Vorlage in der Studio-Schublade: bestehende Vorlagen inline bearbeiten oder
// neu anlegen — ohne die Seite zu verlassen.

const PURPOSES = [
  { id: "SITZUNG", label: "Sitzung" },
  { id: "BILD", label: "Bild" },
  { id: "CHAT", label: "Chat" },
  { id: "KOMBI", label: "Kombi" },
];

export default function SchubladenVorlage({ onCreated }) {
  const { toast } = useToast();
  const [mode, setMode] = useState("bearbeiten");
  const [list, setList] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("SITZUNG");
  const [note, setNote] = useState("");
  const [scope, setScope] = useState("me");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  const loadList = async () => {
    setLoadingList(true);
    try {
      const items = await base44.entities.SzenenVorlage.list("-updated_date");
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
    setPurpose("SITZUNG");
    setNote("");
    setDone(null);
    setMode("neu");
  };

  const loadForEdit = (v) => {
    setEditingId(v.id);
    setName(v.name || "");
    setPurpose(v.purpose || "SITZUNG");
    setNote(v.note || "");
    setDone(null);
    setMode("neu");
  };

  const save = async () => {
    if (busy) return;
    const n = name.trim();
    if (!n) {
      toast({ variant: "destructive", title: "Name fehlt" });
      return;
    }
    setBusy(true);
    try {
      if (editingId) {
        await base44.entities.SzenenVorlage.update(editingId, { name: n, purpose, note });
        setDone({ name: n, id: editingId, local: false, edited: true });
        toast({ title: "Vorlage gespeichert" });
        loadList();
      } else if (scope === "chat") {
        const draft = { name: n, purpose, note, _local: true };
        try {
          const a = JSON.parse(localStorage.getItem("schublade_vorlage_drafts") || "[]");
          a.push(draft);
          localStorage.setItem("schublade_vorlage_drafts", JSON.stringify(a));
        } catch {}
        setDone({ name: n, local: true });
        toast({ title: "Vorlage für diesen Chat bereit", description: "Nicht gespeichert — nur lokal." });
      } else {
        const created = await base44.entities.SzenenVorlage.create({ name: n, purpose, note });
        setDone({ name: n, id: created.id, local: false });
        toast({ title: "Vorlage angelegt", description: "In der Vorlagen-Bibliothek gespeichert." });
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
    setPurpose("SITZUNG");
    setNote("");
    setDone(null);
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-primary/30 bg-card p-4 text-center">
        <Check className="w-5 h-5 text-primary mx-auto mb-2" />
        <p className="font-bold text-foreground">{done.edited ? "Geändert." : `${done.name} ist bereit.`}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {done.local ? "Nur für diesen Chat — nicht gespeichert." : done.edited ? "Änderungen gespeichert." : "In der Vorlagen-Bibliothek gespeichert."}
        </p>
        {!done.local && (
          <a href="/sitzungs-vorlagen" className="mt-2 inline-block text-[11px] text-primary font-semibold">
            Zur Bibliothek
          </a>
        )}
        <button
          onClick={done.edited ? () => setMode("bearbeiten") : reset}
          className="mt-3 block mx-auto px-3 py-1.5 rounded-full bg-elevated text-foreground text-[12px] font-bold"
        >
          {done.edited ? "Zur Liste" : "Nächste Vorlage"}
        </button>
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
            Vorlage zum Bearbeiten wählen — bleibt auf dieser Seite.
          </p>
          {loadingList ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          ) : list.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">Noch keine Vorlagen.</p>
          ) : (
            <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-hide">
              {list.map((v) => (
                <button
                  key={v.id}
                  onClick={() => loadForEdit(v)}
                  className="w-full flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-white/5 text-left"
                >
                  <span className="flex-1 text-[12px] font-semibold text-foreground truncate">{v.name}</span>
                  <span className="text-[10px] text-muted-foreground">{v.purpose}</span>
                  <Pencil className="w-3 h-3 text-muted-foreground" />
                </button>
              ))}
            </div>
          )}
          <button
            onClick={startNew}
            className="mt-2 w-full inline-flex items-center justify-center gap-1.5 rounded-full bg-elevated px-3 py-1.5 text-[11px] font-bold text-muted-foreground hover:text-foreground"
          >
            <FilePlus className="w-3.5 h-3.5" /> Neue Vorlage
          </button>
        </div>
      )}

      {mode === "neu" && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          {editingId && (
            <p className="text-[11px] font-bold uppercase tracking-wider text-primary">Bearbeite: {name}</p>
          )}
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name — z. B. „Sturm-Session"
            className="w-full rounded-xl bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
          />
          <div className="flex gap-1.5">
            {PURPOSES.map((p) => (
              <button
                key={p.id}
                onClick={() => setPurpose(p.id)}
                className={cn(
                  "flex-1 rounded-full px-2 py-1.5 text-[11px] font-bold",
                  purpose === p.id ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Kurz-Notiz — was diese Vorlage bündelt"
            rows={2}
            className="w-full rounded-xl bg-background border border-border px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/50"
          />
          {!editingId && (
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Speichern für</p>
              <div className="flex gap-1.5">
                {[
                  { id: "me", label: "Speichern" },
                  { id: "chat", label: "Nur Chat" },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setScope(s.id)}
                    className={cn(
                      "flex-1 rounded-full px-2 py-1.5 text-[11px] font-bold",
                      scope === s.id ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
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
              {editingId ? "Änderungen speichern" : "Vorlage anlegen"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}