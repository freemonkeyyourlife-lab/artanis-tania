import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Plus, Blocks, Package, Copy, Search, Upload, Mic } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import BlockForm from "@/components/baukasten/BlockForm";
import BlockCard from "@/components/baukasten/BlockCard";
import KitBuilder from "@/components/baukasten/KitBuilder";
import KitCard from "@/components/baukasten/KitCard";
import PhraseBank from "@/components/baukasten/PhraseBank";
import { exportKit, readKitFile, cloneKit, BLOCK_KINDS } from "@/lib/baukasten";

const TABS = [
  { id: "blocks", label: "Bausteine", icon: Blocks },
  { id: "kits", label: "Meine Baukästen", icon: Package },
  { id: "clone", label: "Nachbauen", icon: Copy },
  { id: "phrases", label: "Sprechzeilen", icon: Mic },
];

// Der Baukasten: Bausteine anlegen, zu Paketen zusammensetzen, andere
// nachbauen lassen. Alles einzeln oder alles zusammen — wie du willst.
export default function Baukasten() {
  const [tab, setTab] = useState("blocks");
  const [me, setMe] = useState(null);
  const [blocks, setBlocks] = useState([]);
  const [kits, setKits] = useState([]);
  const [phrases, setPhrases] = useState([]);
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("");

  const [blockForm, setBlockForm] = useState(null); // null | {} | block
  const [kitForm, setKitForm] = useState(null); // null | {} | kit
  const [presetIds, setPresetIds] = useState([]);
  const fileRef = React.useRef(null);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const [user, blockData, kitData, phraseData, voiceData] = await Promise.all([
        base44.auth.me().catch(() => null),
        base44.entities.BuildBlock.list("-created_date", 300),
        base44.entities.BuildKit.list("-created_date", 200),
        base44.entities.VoicePhrase.list("-created_date", 300),
        base44.entities.Voice.list(),
      ]);
      setMe(user);
      setBlocks(blockData);
      setKits(kitData);
      setPhrases(phraseData);
      setVoices(voiceData);
      const params = new URLSearchParams(window.location.search);
      if (params.get("kit")) setTab("clone");
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const myBlocks = blocks.filter((b) => b.created_by_id === me?.id);
  const sharedBlocks = blocks.filter((b) => b.created_by_id !== me?.id);
  const myKits = kits.filter((k) => k.created_by_id === me?.id);
  const sharedKits = kits.filter((k) => k.created_by_id !== me?.id && k.shared);

  const shownBlocks = myBlocks.filter((b) => {
    if (kindFilter && b.blockKind !== kindFilter) return false;
    if (!query.trim()) return true;
    const hay = [b.title, b.personaName, b.situation, ...(b.tags || []), ...(b.activeVariants || [])]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return hay.includes(query.trim().toLowerCase());
  });

  const deleteBlock = async (block) => {
    if (!window.confirm(`"${block.title}" wirklich löschen?`)) return;
    await base44.entities.BuildBlock.delete(block.id);
    setNotice("Baustein gelöscht.");
    load();
  };

  const deleteKit = async (kit) => {
    if (!window.confirm(`"${kit.name}" wirklich löschen?`)) return;
    await base44.entities.BuildKit.delete(kit.id);
    setNotice("Baukasten gelöscht.");
    load();
  };

  const blocksOfKit = (kit) => blocks.filter((b) => (kit.blockIds || []).includes(b.id));

  const clone = async (kit) => {
    try {
      await cloneKit(kit, blocksOfKit(kit));
      setNotice(`"${kit.name}" liegt jetzt als eigener Baukasten bei dir.`);
      setTab("kits");
      load();
    } catch (e) {
      setNotice("Übernehmen hat nicht geklappt.");
    }
  };

  const importFile = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const data = await readKitFile(file);
      const copies = await base44.entities.BuildBlock.bulkCreate(
        data.blocks.map((b) => ({ ...b, shared: false }))
      );
      await base44.entities.BuildKit.create({
        name: data.name || "Importierter Baukasten",
        description: data.description || "",
        personaName: data.personaName || "",
        tags: data.tags || [],
        blockIds: (copies || []).map((c) => c.id),
        shared: false,
      });
      setNotice("Datei eingelesen — der Baukasten liegt bei dir.");
      setTab("kits");
      load();
    } catch (e) {
      setNotice("Die Datei konnte nicht gelesen werden.");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full px-4 lg:px-10 py-8">
      <div className="mb-6">
        <h1 className="font-display text-4xl text-foreground text-gloss">Baukasten</h1>
        <p className="text-[15px] font-semibold text-muted-foreground mt-2 max-w-4xl leading-relaxed">
          Du legst Bausteine an — eine Situation mit Varianten, eine einzelne Datei oder eine ganze
          Szene — und setzt sie zu Paketen zusammen. Jeder Baustein kann tragen, was die Stimme sagen
          soll. Ein Paket lässt sich als Datei sichern, als Link weitergeben und von anderen
          nachbauen.
        </p>
      </div>

      {notice && (
        <p className="glass rounded-xl border border-border px-4 py-3 text-[15px] font-bold text-primary mb-5">
          {notice}
        </p>
      )}

      <div className="glass flex flex-wrap gap-1 p-1.5 rounded-2xl border border-border w-fit mb-6">
        {TABS.map((t) => {
          const Icon = t.icon;
          const count = t.id === "blocks" ? myBlocks.length
            : t.id === "kits" ? myKits.length
            : t.id === "phrases" ? phrases.length
            : sharedKits.length;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[15px] font-bold whitespace-nowrap transition-colors",
                tab === t.id ? "glass-btn glass-btn-accent text-gloss" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-4 h-4" /> {t.label}
              {count > 0 && <span className="text-[12px] opacity-70">{count}</span>}
            </button>
          );
        })}
      </div>

      {tab === "blocks" && (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              onClick={() => setBlockForm({})}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn glass-btn-accent text-[14px] font-bold text-gloss"
            >
              <Plus className="w-4 h-4" /> Neuer Baustein
            </button>
            <div className="relative">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Suchen"
                className="h-10 pl-9 w-56 text-[14px] font-semibold"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {BLOCK_KINDS.map((k) => (
                <button
                  key={k.id}
                  onClick={() => setKindFilter(kindFilter === k.id ? "" : k.id)}
                  className={cn(
                    "px-3.5 py-2 rounded-full border-2 text-[13px] font-bold transition-colors",
                    kindFilter === k.id ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {k.label}
                </button>
              ))}
            </div>
          </div>

          {blockForm && (
            <div className="mb-6">
              <BlockForm
                voices={voices}
                initial={blockForm.id ? blockForm : null}
                onSaved={() => { setBlockForm(null); setNotice("Baustein gespeichert."); load(); }}
                onCancel={() => setBlockForm(null)}
              />
            </div>
          )}

          {shownBlocks.length === 0 ? (
            <p className="text-[15px] font-semibold text-muted-foreground text-center py-16">
              Noch keine Bausteine — leg deinen ersten an.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {shownBlocks.map((b) => (
                <BlockCard
                  key={b.id}
                  block={b}
                  onEdit={setBlockForm}
                  onDelete={deleteBlock}
                  onUse={(block) => { setPresetIds([block.id]); setKitForm({}); setTab("kits"); }}
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "kits" && (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <button
              onClick={() => { setPresetIds([]); setKitForm({}); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn glass-btn-accent text-[14px] font-bold text-gloss"
            >
              <Plus className="w-4 h-4" /> Neuer Baukasten
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[14px] font-bold text-foreground"
            >
              <Upload className="w-4 h-4" /> Datei einlesen
            </button>
            <input ref={fileRef} type="file" accept="application/json" onChange={importFile} className="hidden" />
          </div>

          {kitForm && (
            <div className="mb-6">
              <KitBuilder
                initial={kitForm.id ? kitForm : null}
                blocks={myBlocks}
                presetIds={presetIds}
                onSaved={() => { setKitForm(null); setPresetIds([]); setNotice("Baukasten gespeichert."); load(); }}
                onCancel={() => { setKitForm(null); setPresetIds([]); }}
              />
            </div>
          )}

          {myKits.length === 0 ? (
            <p className="text-[15px] font-semibold text-muted-foreground text-center py-16">
              Noch kein Baukasten — setz aus deinen Bausteinen einen zusammen.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {myKits.map((k) => (
                <KitCard
                  key={k.id}
                  kit={k}
                  blocks={blocks}
                  owned
                  onEdit={setKitForm}
                  onDelete={deleteKit}
                  onExport={(kit) => exportKit(kit, blocksOfKit(kit))}
                />
              ))}
            </div>
          )}
        </>
      )}

      {tab === "phrases" && (
        <PhraseBank phrases={phrases} voices={voices} onChange={load} />
      )}

      {tab === "clone" && (
        <>
          <div className="glass rounded-2xl border-2 border-border p-5 mb-5">
            <p className="font-display text-xl text-foreground mb-1">Fremde Pakete übernehmen</p>
            <p className="text-[15px] font-semibold text-muted-foreground">
              Hier stehen alle Pakete, die andere zum Nachbauen freigegeben haben. Ein Klick legt dir
              eine eigene Kopie an — mit allen Bausteinen und Sprechzeilen. Danach füllst du sie mit
              deinen eigenen Dateien.
            </p>
          </div>

          {sharedKits.length === 0 ? (
            <p className="text-[15px] font-semibold text-muted-foreground text-center py-16">
              Gerade hat niemand etwas zum Nachbauen freigegeben.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {sharedKits.map((k) => (
                <KitCard key={k.id} kit={k} blocks={blocks} owned={false} onClone={clone} />
              ))}
            </div>
          )}

          {sharedBlocks.length > 0 && (
            <p className="text-[14px] font-semibold text-muted-foreground mt-6">
              {sharedBlocks.length} freigegebene Bausteine sind gerade für dich sichtbar.
            </p>
          )}
        </>
      )}
    </div>
  );
}