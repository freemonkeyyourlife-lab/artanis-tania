import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Mic, BookOpen, Package, Loader2 } from "lucide-react";
import { Image } from "@/components/ui/image";
import { useSignedImage } from "@/lib/mediaSign";
import Mischpult from "@/components/charakter/Mischpult";
import CharacterLogbook from "@/components/charakter/CharacterLogbook";
import ErstellenPanel from "@/components/charakter/ErstellenPanel";
import StudioAnleitung from "@/components/studio/StudioAnleitung";
import { PALETTE } from "@/lib/palette";
import { COMBINE_KINDS, modulesOfKind } from "@/lib/combine";
import { exportZip } from "@/lib/exportZip";

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
  const [zipping, setZipping] = useState(false);
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

      <StudioAnleitung pageKey="charakter" />

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

          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="font-display text-4xl text-foreground text-gloss">{character.name}</h1>
              <p className="text-sm text-muted-foreground">
                {character.adultAge}+ {character.art ? `· ${character.art}` : ""} ·{" "}
                {character.createdByRole === "DAVID" ? "von David" : "von Gast"}
              </p>
            </div>
            <button
              onClick={async () => {
                if (zipping) return;
                setZipping(true);
                try {
                  const files = [
                    avatarSrc ? { url: avatarSrc, kind: "image", name: "avatar.png" } : null,
                    bgSrc ? { url: bgSrc, kind: "image", name: "hintergrund.png" } : null,
                    ...(character.images || []).map((u, i) => ({ url: u, kind: "image", name: `bild-${String(i + 1).padStart(2, "0")}.png` })),
                    ...stories.flatMap((s) =>
                      (s.media || []).map((m, i) => ({
                        url: m.url,
                        kind: (m.type || "image").toLowerCase(),
                        name: `story-${String(s.title || "story").replace(/[^\wäöüÄÖÜß-]+/g, "_").slice(0, 30)}-${i + 1}`,
                      }))
                    ),
                  ].filter(Boolean);
                  const text = [
                    `Charakter: ${character.name}`,
                    `Alter: ${character.adultAge}+`,
                    character.art ? `Art: ${character.art}` : "",
                    character.appearance ? `Aussehen: ${character.appearance}` : "",
                    character.behavior ? `Benehmen: ${character.behavior}` : "",
                    character.understanding ? `Verständnis: ${character.understanding}` : "",
                    character.personality ? `Persönlichkeit: ${character.personality}` : "",
                    character.description ? `Beschreibung: ${character.description}` : "",
                    character.relationship ? `Beziehung: ${character.relationship}` : "",
                    `Neigungen: ${(character.neigungen || []).join(", ")}`,
                    "",
                    `Storys: ${stories.length}`,
                    ...stories.map((s) => `- ${s.title}`),
                  ].filter((l) => l !== "").join("\n");
                  await exportZip({
                    name: `charakter-${character.name}`,
                    files,
                    textName: "charakter.txt",
                    text,
                  });
                } finally {
                  setZipping(false);
                }
              }}
              disabled={zipping}
              title="Alle Bilder, Story-Medien und die Charakter-Daten als ZIP auf die Festplatte"
              className="glass-btn glass-btn-accent inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm disabled:opacity-50"
            >
              {zipping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package className="h-4 w-4" />} Export als ZIP
            </button>
          </div>

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