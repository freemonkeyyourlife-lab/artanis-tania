import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Plus, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Vorlage schnell anlegen — direkt in der Studio-Schublade, ohne die Seite zu
// verlassen. Speicherort: speichern (in die Bibliothek) oder nur für diesen Chat.

const PURPOSES = [
  { id: "SITZUNG", label: "Sitzung" },
  { id: "BILD", label: "Bild" },
  { id: "CHAT", label: "Chat" },
  { id: "KOMBI", label: "Kombi" },
];

export default function SchubladenVorlage({ onCreated }) {
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [purpose, setPurpose] = useState("SITZUNG");
  const [note, setNote] = useState("");
  const [scope, setScope] = useState("me");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  const save = async () => {
    if (busy) return;
    const n = name.trim();
    if (!n) {
      toast({ variant: "destructive", title: "Name fehlt" });
      return;
    }
    setBusy(true);
    try {
      if (scope === "chat") {
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
    setPurpose("SITZUNG");
    setNote("");
    setDone(null);
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-primary/30 bg-card p-4 text-center">
        <Check className="w-5 h-5 text-primary mx-auto mb-2" />
        <p className="font-bold text-foreground">{done.name} ist bereit.</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          {done.local ? "Nur für diesen Chat — nicht gespeichert." : "In der Vorlagen-Bibliothek gespeichert."}
        </p>
        {!done.local && (
          <a
            href="/sitzungs-vorlagen"
            className="mt-2 inline-block text-[11px] text-primary font-semibold"
          >
            Zur Bibliothek
          </a>
        )}
        <button
          onClick={reset}
          className="mt-3 block mx-auto px-3 py-1.5 rounded-full bg-elevated text-foreground text-[12px] font-bold"
        >
          Nächste Vorlage
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <p className="font-display text-base text-foreground">Vorlage schnell anlegen</p>
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
      <button
        onClick={save}
        disabled={busy}
        className="glass-btn glass-btn-accent w-full inline-flex items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        Vorlage anlegen
      </button>
    </div>
  );
}