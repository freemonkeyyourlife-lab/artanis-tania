import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, ArrowLeft, Palette as PaletteIcon, Blocks, Download } from "lucide-react";
import CharacterSheet from "@/components/charakter/CharacterSheet";
import CharacterTile from "@/components/charakter/CharacterTile";
import { PALETTE } from "@/lib/palette";

// Die Charakter-Werkstatt: Figuren anlegen und pflegen. David und Gäste füllen
// dieselben sechs Felder — Aussehen, Art, Benehmen, Stimme, Neigung, Verständnis.
export default function CharakterStudio() {
  const [me, setMe] = useState(null);
  const [characters, setCharacters] = useState([]);
  const [paletteList, setPaletteList] = useState(PALETTE);
  const [voices, setVoices] = useState([]);
  const [modules, setModules] = useState([]);
  const [sheet, setSheet] = useState(null); // null | {} | character
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [user, chars, neig, voiceList, mods] = await Promise.all([
      base44.auth.me().catch(() => null),
      base44.entities.Character.list("-created_date", 200).catch(() => []),
      base44.entities.Neigung.filter({ active: true }, { sort: "level", limit: 50 }).catch(() => ({ items: [] })),
      base44.entities.Voice.list("-created_date", 200).catch(() => []),
      base44.entities.CharacterModule.filter({ active: true }, { sort: "order", limit: 200 }).catch(() => ({ items: [] })),
    ]);
    setMe(user);
    setCharacters(chars || []);
    setPaletteList(neig.items?.length ? neig.items : PALETTE);
    setVoices(voiceList || []);
    setModules(mods.items || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const remove = async (character) => {
    if (!window.confirm(`"${character.name}" wirklich löschen?`)) return;
    await base44.entities.Character.delete(character.id);
    load();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link to="/palette" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Zur Palette
      </Link>

      <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl text-foreground text-gloss">Charakter-Werkstatt</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Aussehen, Art, Benehmen, Stimme, Neigung und Verständnis — sechs Felder, dieselben für
            David und für Gäste. Jedes Feld lässt sich einsprechen statt tippen.
          </p>
        </div>
        <button
          onClick={() => setSheet({})}
          className="glass-btn glass-btn-accent inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm"
        >
          <Plus className="h-4 w-4" /> Neue Figur
        </button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link to="/palette" className="glass-btn inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px]">
          <PaletteIcon className="h-4 w-4" /> Neigungen & Bausteine
        </Link>
        <Link to="/baukasten" className="glass-btn inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px]">
          <Blocks className="h-4 w-4" /> Baukasten
        </Link>
        <Link to="/botimport" className="glass-btn inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px]">
          <Download className="h-4 w-4" /> Bot / Agent importieren
        </Link>
        <Link to="/mitmachen" className="glass-btn inline-flex items-center gap-2 rounded-full px-4 py-2 text-[13px]">
          Mitmachen — Co-Creation
        </Link>
      </div>

      {sheet && (
        <div className="mt-6">
          <CharacterSheet
            initial={sheet.id ? sheet : null}
            me={me}
            onSaved={() => {
              setSheet(null);
              load();
            }}
            onCancel={() => setSheet(null)}
          />
        </div>
      )}

      {characters.length === 0 ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Noch keine Figur — leg die erste an.
        </p>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {characters.map((c) => (
            <CharacterTile
              key={c.id}
              character={c}
              paletteList={paletteList}
              voices={voices}
              modules={modules}
              onEdit={setSheet}
              onDelete={remove}
            />
          ))}
        </div>
      )}
    </div>
  );
}