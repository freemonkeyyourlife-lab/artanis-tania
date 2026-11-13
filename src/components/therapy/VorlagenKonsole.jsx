import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bookmark, Plus, Trash2, Check, Loader2 } from "lucide-react";

// Seitliche Vorlagen-Konsole pro Chat: bestehende Sitzungs-Vorlagen anwenden,
// eine neue aus der aktuellen Sitzung sichern oder eine Vorlage löschen.
// Wenn keine angewendet wird, läuft die Sitzung einfach so weiter wie bisher.

export default function VorlagenKonsole({ session, onApplied }) {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState("");
  const [name, setName] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const r = await base44.entities.SzenenVorlage.filter({ purpose: "SITZUNG" }, "order", 100);
      setList(r || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveNew = async () => {
    const n = (name || session?.topic || "Sitzungs-Setup").trim();
    if (!n || !session) return;
    setBusy("new");
    try {
      await base44.entities.SzenenVorlage.create({
        name: n,
        purpose: "SITZUNG",
        note: session.topic || "",
        setup: {
          roleSetup: session.roleSetup,
          mode: session.mode,
          intensity: session.intensity,
          therapistName: session.therapistName,
          therapistAge: session.therapistAge,
          therapistType: session.therapistType,
          therapistStyle: session.therapistStyle,
          therapistRole: session.therapistRole,
          therapistVoice: session.therapistVoice,
          cast: session.cast || [],
          actor: session.actor || {},
          topic: session.topic,
        },
      });
      setName("");
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy("");
    }
  };

  const apply = async (tpl) => {
    if (!session || !tpl.setup) return;
    setBusy(tpl.id);
    try {
      const s = tpl.setup;
      const updated = await base44.entities.TherapySession.update(session.id, {
        roleSetup: s.roleSetup || session.roleSetup,
        mode: s.mode || session.mode,
        intensity: s.intensity || session.intensity,
        therapistName: s.therapistName,
        therapistAge: s.therapistAge,
        therapistType: s.therapistType,
        therapistStyle: s.therapistStyle,
        therapistRole: s.therapistRole,
        therapistVoice: s.therapistVoice,
        cast: s.cast || [],
        actor: s.actor || {},
        topic: s.topic || session.topic,
      });
      await base44.entities.TherapyMessage.create({
        sessionId: session.id,
        senderType: "SYSTEM",
        text: `Vorlage „${tpl.name}" angewendet.`,
      });
      onApplied?.(updated);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy("");
    }
  };

  const remove = async (id) => {
    setBusy("del-" + id);
    try {
      await base44.entities.SzenenVorlage.delete(id);
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between text-left">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground">
          <Bookmark className="w-3.5 h-3.5 text-primary" /> Vorlagen-Konsole
        </span>
        <span className="text-[11px] text-muted-foreground">{open ? "Ausblenden" : "Anpassen"}</span>
      </button>
      {open && (
        <div className="mt-3 space-y-2">
          <p className="text-[11px] text-muted-foreground">
            Vorlage anwenden — sonst läuft die Sitzung einfach so weiter.
          </p>
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />}
          <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-hide">
            {list.length === 0 && !loading && (
              <p className="text-[11px] text-muted-foreground">Noch keine Vorlagen.</p>
            )}
            {list.map((tpl) => (
              <div key={tpl.id} className="flex items-center gap-1.5 rounded-xl bg-elevated/60 p-2">
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-bold text-foreground truncate">{tpl.name}</p>
                  {tpl.note && <p className="text-[10px] text-muted-foreground truncate">{tpl.note}</p>}
                </div>
                <button
                  onClick={() => apply(tpl)}
                  disabled={!!busy}
                  className="px-2 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold disabled:opacity-50"
                  title="Auf diese Sitzung anwenden"
                >
                  {busy === tpl.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                </button>
                <button
                  onClick={() => remove(tpl.id)}
                  disabled={!!busy}
                  className="px-1.5 py-1 rounded-full bg-elevated text-muted-foreground hover:text-destructive disabled:opacity-50"
                  title="Vorlage löschen"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-1.5">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Neue aus dieser Sitzung"
              className="flex-1 px-2.5 py-1.5 rounded-full bg-background border border-border text-[11px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
            <button
              onClick={saveNew}
              disabled={!!busy || !session}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold disabled:opacity-50"
              title="Aktuelles Setup als neue Vorlage sichern"
            >
              {busy === "new" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />} Neu
            </button>
          </div>
        </div>
      )}
    </div>
  );
}