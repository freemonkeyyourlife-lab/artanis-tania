import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Mic, BookOpen } from "lucide-react";
import { Image } from "@/components/ui/image";
import { useSignedImage } from "@/lib/mediaSign";
import Mischpult from "@/components/charakter/Mischpult";
import CharacterLogbook from "@/components/charakter/CharacterLogbook";
import ErstellenPanel from "@/components/charakter/ErstellenPanel";
import { PALETTE } from "@/lib/palette";
import { COMBINE_KINDS, modulesOfKind } from "@/lib/combine";

// Eine Figur aufgeschlagen: großes Bild, alle sechs Felder, das Mischpult und
// die Logbuchaufträge. Hier wird zusammengestellt wie im Baukasten.
export default function CharakterDetail() {
  const { id } = useParams();
  const [character, setCharacter] = useState(null);
  const [stories, setStories] = useState([]);
  const [paletteList, setPaletteList] = useState(PALETTE);
  const [modules, setModules] = useState([]);
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const avatarSrc = useSignedImage(character?.avatar);
  const bgSrc = useSignedImage(character?.backgroundImage);

  const load = async () => {
    const c = await base44.entities.Character.get(id).catch(() => null);
    setCharacter(c);
    if (c) {
      const s = await base44.entities.Story.filter({ creatorId: id }, "-created_date", 50).catch(() => []);
      setStories(s || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    base44.entities.Neigung.filter({ active: true }, { sort: "level", limit: 50 })
      .then((p) => p.items?.length && setPaletteList(p.items)).catch(() => {});
    base44.entities.CharacterModule.filter({ active: true }, { sort: "order", limit: 200 })
      .then((p) => setModules(p.items || [])).catch(() => {});
    base44.entities.Voice.list("-created_date", 200).then((l) => setVoices(l || [])).catch(() => {});
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary" />
      </div>
    );
  }

  if (!character) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-20 text-center">
        <p className="text-sm text-muted-foreground">Diese Figur gibt es nicht mehr.</p>
        <Link to="/charakter" className="glass-btn mt-4 inline-block rounded-full px-5 py-2.5 text-sm">
          Zur Charakter-Werkstatt
        </Link>
      </div>
    );
  }

  const neigungen = (character.neigungen || [])
    .map((k) => paletteList.find((p) => (p.key || p.id) === k)?.label || k);
  const voice = voices.find((v) => v.id === character.voiceId);
  const picked = modules.filter((m) => (character.moduleIds || []).includes(m.id));

  const FIELDS = [
    ["Aussehen", character.appearance],
    ["Art", character.art],
    ["Benehmen", character.behavior],
    ["Verständnis", character.understanding],
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link to="/charakter" className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Zur Charakter-Werkstatt
      </Link>

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
        <div className="relative">
          {bgSrc ? (
            <div
              className="absolute inset-0 rounded-3xl bg-cover bg-center -z-10"
              style={{ backgroundImage: `url(${bgSrc})` }}
            />
          ) : null}
          {avatarSrc ? (
            <Image
              src={avatarSrc}
              fittingType="fill"
              className="aspect-[3/4] w-full rounded-3xl"
            />
          ) : (
            <div className="flex aspect-[3/4] w-full items-center justify-center rounded-3xl bg-elevated font-display text-6xl text-primary">
              {character.name.charAt(0)}
            </div>
          )}

          <h1 className="mt-4 font-display text-4xl text-foreground text-gloss">{character.name}</h1>
          <p className="text-sm text-muted-foreground">
            {character.adultAge}+ {character.art ? `· ${character.art}` : ""} ·{" "}
            {character.createdByRole === "DAVID" ? "von David" : "von Gast"}
          </p>

          <div className="mt-4 space-y-3">
            {FIELDS.map(([label, value]) => (
              <div key={label} className="glass rounded-2xl border border-border p-3">
                <p className="text-[11px] text-muted-foreground">{label}</p>
                <p className="text-[13px] text-foreground">{value || "—"}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center gap-2 text-[13px] text-muted-foreground">
            <Mic className="h-4 w-4 text-primary" /> Stimme: {voice ? voice.name : "noch keine gewählt"}
          </div>

          {neigungen.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {neigungen.map((n) => (
                <span key={n} className="rounded-full border border-border px-2.5 py-0.5 text-[11px] text-foreground">
                  {n}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-5">
          <Mischpult character={character} onSaved={load} />

          <ErstellenPanel character={character} />

          <div className="glass rounded-2xl border border-border p-4">
            <div className="mb-2 font-display text-lg text-foreground">Was macht man</div>
            {picked.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">
                Noch nichts gewählt — im Mischpult oben zusammenstellen.
              </p>
            ) : (
              COMBINE_KINDS.map((k) => {
                const of = picked.filter((m) => m.kind === k.id);
                if (!of.length) return null;
                return (
                  <div key={k.id} className="mt-2">
                    <p className="text-[11px] text-muted-foreground">{k.label}</p>
                    <p className="text-[13px] text-foreground">{of.map((m) => m.title).join(", ")}</p>
                  </div>
                );
              })
            )}
          </div>

          <CharacterLogbook character={character} />

          <div className="glass rounded-2xl border border-border p-4">
            <div className="mb-2 flex items-center gap-2 font-display text-lg text-foreground">
              <BookOpen className="h-4 w-4 text-primary" /> Storys
            </div>
            {stories.length === 0 ? (
              <p className="text-[12px] text-muted-foreground">
                Noch keine Story zu dieser Figur — unter „Mitmachen" eine entstehen lassen.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {stories.map((s) => (
                  <Link key={s.id} to="/stories" className="block">
                    {s.preview && (
                      <Image src={s.preview} fittingType="fill" className="h-40 w-full rounded-2xl" />
                    )}
                    <p className="mt-2 text-[13px] font-semibold text-foreground">{s.title}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}