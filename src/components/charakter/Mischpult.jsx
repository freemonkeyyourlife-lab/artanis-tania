import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Sparkles, Save, BookOpen, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import VoiceInput from "@/components/VoiceInput";
import NeigungChips from "@/components/palette/NeigungChips";
import { PALETTE, paletteTone } from "@/lib/palette";
import { COMBINE_KINDS, modulesOfKind } from "@/lib/combine";

const inputCls =
  "w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50";

// Das Mischpult. Alles, was mit Gefühl zu tun hat, steht hier an einer Stelle:
// Neigung, Rolle, Situation, Szenario, Erstellung und Stimme — für David und
// für Gäste dieselben Regler. Oben im Studio, in jeder Figur, überall gleich.
export default function Mischpult({ character = null, onSaved }) {
  const [neigungen, setNeigungen] = useState([]);
  const [modules, setModules] = useState([]);
  const [voices, setVoices] = useState([]);
  const [picked, setPicked] = useState([]);
  const [pickedModules, setPickedModules] = useState([]);
  const [voiceId, setVoiceId] = useState("");
  const [doing, setDoing] = useState("");
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    base44.entities.Neigung.filter({ active: true }, { sort: "level", limit: 50 })
      .then((p) => setNeigungen(p.items?.length ? p.items : PALETTE)).catch(() => setNeigungen(PALETTE));
    base44.entities.CharacterModule.filter({ active: true }, { sort: "order", limit: 200 })
      .then((p) => setModules(p.items || [])).catch(() => setModules([]));
    base44.entities.Voice.list("-created_date", 200)
      .then((l) => setVoices((l || []).filter((v) => v.active !== false))).catch(() => setVoices([]));
  }, []);

  // Steht eine Figur dahinter, kommt ihre Einstellung ins Pult.
  useEffect(() => {
    setPicked(character?.neigungen || []);
    setPickedModules(character?.moduleIds || []);
    setVoiceId(character?.voiceId || "");
    setDoing(character?.behavior || "");
  }, [character?.id]);

  const toggle = (key) =>
    setPicked((p) => (p.includes(key) ? p.filter((k) => k !== key) : [...p, key]));
  const toggleModule = (id) =>
    setPickedModules((p) => (p.includes(id) ? p.filter((k) => k !== id) : [...p, id]));

  const tone = paletteTone(neigungen, picked);

  const save = async () => {
    if (!character?.id) return;
    setBusy("save");
    setNote("");
    try {
      await base44.entities.Character.update(character.id, {
        neigungen: picked,
        moduleIds: pickedModules,
        voiceId,
        behavior: doing,
      });
      setNote("Übernommen — die Figur klingt jetzt so.");
      onSaved?.();
    } catch (e) {
      setNote("Übernehmen hat nicht geklappt.");
    } finally {
      setBusy("");
    }
  };

  const toLogbook = async () => {
    setBusy("log");
    setNote("");
    try {
      await base44.entities.BuildTask.create({
        title: character ? `Figur „${character.name}" fertigstellen` : "Neue Figur aus dem Mischpult",
        description: doing,
        prompt: [
          character ? `Figur: ${character.name}` : "Neue Figur",
          picked.length ? `Neigung: ${picked.join(", ")}` : "",
          `Ton: ${tone}`,
        ].filter(Boolean).join("\n"),
        status: "WARTESCHLANGE",
        kind: "DESIGN",
        source: "GODMODE",
      });
      setNote("Steht im Logbuch — dort abholen.");
    } catch (e) {
      setNote("Ins Logbuch legen hat nicht geklappt.");
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="glass rounded-2xl border border-border p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-display text-lg text-foreground">Mischpult</span>
          <span className="text-[11px] text-muted-foreground">Ton: {tone}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/charakter" className="glass-btn rounded-full px-4 py-1.5 text-[12px] text-muted-foreground">
            Selbst erstellen
          </Link>
          <Link to="/logbuch" className="glass-btn rounded-full px-4 py-1.5 text-[12px] text-muted-foreground">
            Zum Logbuch
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="mb-1.5 text-[11px] text-muted-foreground">Neigung</p>
          <NeigungChips items={neigungen.length ? neigungen : PALETTE} value={picked} onToggle={toggle} />
        </div>

        {COMBINE_KINDS.map((k) => {
          const items = modulesOfKind(modules, k.id);
          if (!items.length) return null;
          return (
            <div key={k.id}>
              <p className="mb-1.5 text-[11px] text-muted-foreground">{k.label}</p>
              <div className="flex flex-wrap gap-1.5">
                {items.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => toggleModule(m.id)}
                    className={cn(
                      "glass-btn rounded-full px-3 py-1 text-[12px]",
                      pickedModules.includes(m.id) && "glass-btn-accent"
                    )}
                  >
                    {m.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-[11px] text-muted-foreground">Stimme</p>
            <select value={voiceId} onChange={(e) => setVoiceId(e.target.value)} className={inputCls}>
              <option value="">Keine — Gerätestimme</option>
              {voices.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <div>
            <p className="mb-1.5 text-[11px] text-muted-foreground">Was macht man</p>
            <div className="flex items-start gap-2">
              <VoiceInput onResult={(t) => setDoing((d) => (d ? `${d} ${t}` : t))} />
              <input
                value={doing}
                onChange={(e) => setDoing(e.target.value)}
                placeholder="Was sie in der Szene tut"
                className={inputCls}
              />
            </div>
          </div>
        </div>
      </div>

      {note && <p className="mt-3 text-[12px] font-bold text-primary">{note}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {character?.id ? (
          <button
            onClick={save}
            disabled={!!busy}
            className="glass-btn glass-btn-accent inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm disabled:opacity-50"
          >
            {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Auf die Figur übernehmen
          </button>
        ) : (
          <Link
            to="/charakter"
            className="glass-btn glass-btn-accent inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm"
          >
            <Plus className="h-4 w-4" /> Selbst erstellen
          </Link>
        )}
        <button
          onClick={toLogbook}
          disabled={!!busy}
          className="glass-btn inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm disabled:opacity-50"
        >
          {busy === "log" ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
          Auftrag ins Logbuch
        </button>
      </div>
    </div>
  );
}