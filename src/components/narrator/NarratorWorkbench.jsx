import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Check, Loader2, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NARRATOR_GENDERS, NARRATOR_KINDS } from "@/lib/narratorStyle";
import { inputCls, labelCls, chipCls, btnCls, btnAccentCls } from "@/lib/narratorUi";
import NarratorImageBlock from "@/components/narrator/NarratorImageBlock";
import NarratorVoiceBlock from "@/components/narrator/NarratorVoiceBlock";
import NarratorTextBlock from "@/components/narrator/NarratorTextBlock";
import NarratorRegieBlock from "@/components/narrator/NarratorRegieBlock";
import ConciergePanel from "@/components/studio/ConciergePanel";

// Die vier Blöcke, in denen sie fertig wird — plus der Story-Modus, in dem
// zwei von ihnen abwechselnd durch die Geschichten führen.
const TABS = [
  { id: "bild", label: "Bild" },
  { id: "stimme", label: "Stimme" },
  { id: "text", label: "Text" },
  { id: "regie", label: "Regie" },
  { id: "story", label: "Story-Modus" },
];

const rows = (res) => (Array.isArray(res) ? res : res?.items || []);

export default function NarratorWorkbench() {
  const [list, setList] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("bild");
  const [identity, setIdentity] = useState({ name: "", kind: "ERZAEHLERIN", gender: "WEIBLICH", active: true });
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const load = async (keepId) => {
    const items = rows(await base44.entities.Narrator.list("order").catch(() => []));
    setList(items);
    const pick = items.find((x) => x.id === keepId) || items[0] || null;
    setCurrent(pick);
    setIdentity({
      name: pick?.name || "",
      kind: pick?.kind || "ERZAEHLERIN",
      gender: pick?.gender || "WEIBLICH",
      active: pick?.active !== false,
    });
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const onSaved = (rec) => {
    if (!rec?.id) return;
    setCurrent((c) => ({ ...c, ...rec }));
    setList((l) => l.map((x) => (x.id === rec.id ? { ...x, ...rec } : x)));
  };

  const create = async () => {
    setBusy(true);
    try {
      const rec = await base44.entities.Narrator.create({ name: "Neue Figur", order: Date.now() });
      await load(rec.id);
      setTab("bild");
    } finally {
      setBusy(false);
    }
  };

  const saveIdentity = async () => {
    if (!current?.id || !identity.name.trim()) return;
    setBusy(true);
    setNote("");
    try {
      const rec = await base44.entities.Narrator.update(current.id, { ...identity, name: identity.name.trim() });
      onSaved(rec);
      setNote("Gespeichert.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!current?.id) return;
    if (!window.confirm(`"${current.name}" entfernen?`)) return;
    await base44.entities.Narrator.delete(current.id);
    await load();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> <span className="text-[14px] font-semibold">Wird geladen …</span>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="glass rounded-2xl border-2 border-border p-6 text-center">
        <p className="text-[15px] font-bold text-foreground mb-3">Noch keine Figur da.</p>
        <button onClick={create} disabled={busy} className={btnAccentCls}>
          <Plus className="w-4 h-4" /> Erste Figur anlegen
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 mb-4">
        {list.map((n) => (
          <button
            key={n.id}
            onClick={() => load(n.id)}
            className={chipCls(current.id === n.id)}
          >
            {n.name || "Ohne Namen"}
          </button>
        ))}
        <button onClick={create} disabled={busy} className={btnCls}>
          <Plus className="w-3.5 h-3.5" /> Neue Figur
        </button>
      </div>

      <div className="glass rounded-2xl border-2 border-border p-5 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Ihr Name</label>
            <input
              value={identity.name}
              onChange={(e) => setIdentity({ ...identity, name: e.target.value })}
              placeholder="z. B. Mira"
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Rolle</label>
            <select value={identity.kind} onChange={(e) => setIdentity({ ...identity, kind: e.target.value })} className={inputCls}>
              {NARRATOR_KINDS.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Sie oder er</label>
            <div className="flex flex-wrap gap-1.5">
              {NARRATOR_GENDERS.map((g) => (
                <button key={g.id} onClick={() => setIdentity({ ...identity, gender: g.id })} className={chipCls(identity.gender === g.id)}>
                  {g.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 mt-4">
          <button onClick={saveIdentity} disabled={busy || !identity.name.trim()} className={btnAccentCls}>
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Speichern
          </button>
          <button
            onClick={() => setIdentity({ ...identity, active: !identity.active })}
            className={cn(btnCls, identity.active ? "text-primary" : "text-muted-foreground")}
          >
            {identity.active ? "Sie ist im Einsatz" : "Sie ist abgeschaltet"}
          </button>
          <button onClick={remove} className="ml-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-destructive/15 text-destructive text-[13px] font-bold">
            <Trash2 className="w-4 h-4" /> Entfernen
          </button>
          {note && <span className="text-[12px] font-semibold text-muted-foreground">{note}</span>}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={chipCls(tab === t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div key={current.id} className="glass rounded-2xl border-2 border-border p-5">
        {tab === "bild" && <NarratorImageBlock narrator={current} onSaved={onSaved} />}
        {tab === "stimme" && <NarratorVoiceBlock narrator={current} onSaved={onSaved} />}
        {tab === "text" && <NarratorTextBlock narrator={current} onSaved={onSaved} />}
        {tab === "regie" && <NarratorRegieBlock narrator={current} onSaved={onSaved} />}
        {tab === "story" && <ConciergePanel />}
      </div>
    </div>
  );
}