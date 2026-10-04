import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import NeigungChips from "@/components/palette/NeigungChips";
import ModulePicker from "@/components/palette/ModulePicker";
import BriefingBox from "@/components/palette/BriefingBox";
import { PALETTE, paletteTone } from "@/lib/palette";
import { COMBINE_KINDS, combineBriefing, combineVoiceDelta, modulesOfKind } from "@/lib/combine";

// Das Fundament: hier wird aus Neigungen und Bausteinen eine Anweisung.
// Jeder Baustein passt zu jedem — es gibt keine festen Paare.
export default function Palette() {
  const [neigungen, setNeigungen] = useState([]);
  const [modules, setModules] = useState([]);
  const [picked, setPicked] = useState([]);
  const [chosen, setChosen] = useState([]);

  useEffect(() => {
    base44.entities.Neigung.filter({ active: true }, { sort: "level", limit: 50 })
      .then((page) => setNeigungen(page.items || []))
      .catch(() => setNeigungen([]));
    base44.entities.CharacterModule.filter({ active: true }, { sort: "order", limit: 200 })
      .then((page) => setModules(page.items || []))
      .catch(() => setModules([]));
  }, []);

  const paletteList = neigungen.length ? neigungen : PALETTE;

  const toggleNeigung = (key) =>
    setPicked((cur) => (cur.includes(key) ? cur.filter((k) => k !== key) : [...cur, key]));

  const toggleModule = (id) =>
    setChosen((cur) => (cur.includes(id) ? cur.filter((k) => k !== id) : [...cur, id]));

  const createModule = async (kind, title) => {
    const created = await base44.entities.CharacterModule.create({ title, kind });
    setModules((cur) => [...cur, created]);
    setChosen((cur) => [...cur, created.id]);
  };

  const briefing = useMemo(
    () =>
      combineBriefing({
        paletteList,
        neigungen: picked,
        modules: modules.filter((m) => chosen.includes(m.id)),
      }),
    [paletteList, picked, modules, chosen]
  );

  const voiceDelta = combineVoiceDelta({ paletteList, neigungen: picked });

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link to="/baukasten" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Zum Baukasten
      </Link>

      <h1 className="mt-4 font-display text-4xl">Neigungen und Bausteine</h1>
      <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
        Wähle Neigungen, dann Rollen, Situationen, Szenarien, Erstellungen und Importe.
        Alles lässt sich mit allem verbinden — rechts wächst daraus eine fertige Anweisung.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-border bg-card p-4">
            <div className="font-heading">Neigungs-Palette</div>
            <div className="mb-3 text-xs text-muted-foreground">
              Mehrere gleichzeitig möglich. Aufsteigend nach Stufe.
            </div>
            <NeigungChips items={paletteList} value={picked} onToggle={toggleNeigung} />
          </section>

          {COMBINE_KINDS.map((k) => (
            <ModulePicker
              key={k.id}
              label={k.label}
              hint={k.hint}
              items={modulesOfKind(modules, k.id)}
              value={chosen}
              onToggle={toggleModule}
              onCreate={(title) => createModule(k.id, title)}
            />
          ))}
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <BriefingBox
            text={briefing}
            voiceDelta={voiceDelta}
            tone={paletteTone(paletteList, picked)}
          />
        </div>
      </div>
    </div>
  );
}