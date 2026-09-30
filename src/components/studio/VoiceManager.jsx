import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Mic, Pencil, Plus, Trash2, Star, Search, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveVoice } from "@/lib/voiceDj";
import VoiceForm from "@/components/studio/VoiceForm";
import VoicePreviewButton from "@/components/voice/VoicePreviewButton";
import ElevenLabsImport from "@/components/studio/ElevenLabsImport";
import VoiceSayBox from "@/components/studio/VoiceSayBox";

const SORTS = [
  { id: "favorite", label: "Favoriten zuerst" },
  { id: "new", label: "Neueste zuerst" },
  { id: "name", label: "Name A–Z" },
  { id: "tempo", label: "Tempo" },
];

const SOURCE_LABEL = {
  EINGESPROCHEN: "Eingesprochen",
  HOCHGELADEN: "Hochgeladen",
  GRUNDSTIMME: "Grundstimme",
};

export default function VoiceManager() {
  const [voices, setVoices] = useState([]);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("favorite");
  const [tagFilter, setTagFilter] = useState("");
  const [showImport, setShowImport] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [v, c] = await Promise.all([
        base44.entities.Voice.list("-created_date"),
        base44.entities.Creator.list("-created_date"),
      ]);
      setVoices(v);
      setCreators(c);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (voice) => {
    if (!window.confirm(`Stimme "${voice.name}" wirklich löschen?`)) return;
    await base44.entities.Voice.delete(voice.id);
    load();
  };

  const toggleActive = async (voice) => {
    await base44.entities.Voice.update(voice.id, { active: voice.active === false });
    load();
  };

  const toggleFavorite = async (voice) => {
    await base44.entities.Voice.update(voice.id, { favorite: voice.favorite !== true });
    load();
  };

  // Freigeben: danach darf sie jeder nutzen — nicht nur du.
  const togglePublic = async (voice) => {
    await base44.entities.Voice.update(voice.id, { public: voice.public === false });
    load();
  };

  // Eine Stimme gehört immer nur einem Charakter — vorher beim alten lösen.
  const assign = async (voice, creatorId) => {
    const previous = creators.filter((c) => c.voiceProfileId === voice.id && c.id !== creatorId);
    for (const c of previous) {
      await base44.entities.Creator.update(c.id, { voiceProfileId: "" });
    }
    if (creatorId) await base44.entities.Creator.update(creatorId, { voiceProfileId: voice.id });
    load();
  };

  // Alle Schlagworte, die irgendwo vergeben sind — daraus baust du dir den Fundus.
  const allTags = useMemo(
    () => Array.from(new Set(voices.flatMap((v) => v.tags || []))).sort((a, b) => a.localeCompare(b)),
    [voices]
  );

  const shown = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = voices.filter((v) => {
      if (tagFilter && !(v.tags || []).includes(tagFilter)) return false;
      if (!needle) return true;
      return [v.name, v.description, v.ownerName, v.originNote, ...(v.tags || [])]
        .filter(Boolean).join(" ").toLowerCase().includes(needle);
    });
    const sorted = [...list];
    if (sort === "favorite") sorted.sort((a, b) => Number(b.favorite === true) - Number(a.favorite === true) || (a.name || "").localeCompare(b.name || ""));
    if (sort === "new") sorted.sort((a, b) => String(b.created_date || "").localeCompare(String(a.created_date || "")));
    if (sort === "name") sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    if (sort === "tempo") sorted.sort((a, b) => (a.speed || 1) - (b.speed || 1));
    return sorted;
  }, [voices, q, sort, tagFilter]);

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Stimme suchen — Name, Schlagwort, woher sie kommt"
            className="w-full pl-9 pr-4 py-2.5 rounded-full bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-4 py-2.5 rounded-full bg-elevated border border-border text-xs font-semibold text-muted-foreground focus:outline-none focus:border-primary/50"
        >
          {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <button
          onClick={() => setShowImport((s) => !s)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-elevated border border-border text-sm font-semibold text-foreground whitespace-nowrap hover:border-primary/50 transition-colors"
        >
          <Download className="w-4 h-4" /> Aus ElevenLabs
        </button>
        <button
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Neue Stimme
        </button>
      </div>

      <VoiceSayBox voices={voices} />

      {showImport && (
        <div className="mb-5">
          <ElevenLabsImport
            existingIds={voices.map((v) => v.externalVoiceId).filter(Boolean)}
            onImported={load}
          />
        </div>
      )}

      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          {tagFilter && (
            <button onClick={() => setTagFilter("")} className="px-3 py-1 rounded-full bg-primary/20 border border-primary text-[11px] font-semibold text-primary">
              Filter weg ×
            </button>
          )}
          {allTags.map((t) => (
            <button
              key={t}
              onClick={() => setTagFilter(tagFilter === t ? "" : t)}
              className={cn(
                "px-3 py-1 rounded-full border text-[11px] font-semibold transition-colors",
                tagFilter === t ? "bg-primary text-primary-foreground border-primary" : "bg-elevated border-border text-muted-foreground hover:text-foreground"
              )}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {editing && (
        <div className="mb-8">
          <VoiceForm
            initial={editing === "new" ? null : editing}
            onSaved={() => { setEditing(null); load(); }}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {shown.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">
          {voices.length === 0
            ? "Noch keine Stimmen — sprich deine erste ein oder lade eine Datei hoch."
            : "Nichts gefunden. Suchbegriff oder Filter zurücksetzen."}
        </p>
      ) : (
        <div className="space-y-3">
          {shown.map((voice) => {
            const assigned = creators.find((c) => c.voiceProfileId === voice.id);
            const v = resolveVoice(voice);
            return (
              <div key={voice.id} className={cn("rounded-2xl border border-border bg-card p-4", voice.active === false && "opacity-60")}>
                <div className="flex flex-wrap items-start gap-4">
                  <button
                    onClick={() => toggleFavorite(voice)}
                    title={voice.favorite ? "Favorit wegnehmen" : "Als Favorit merken"}
                    className="w-11 h-11 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 hover:bg-primary/25 transition-colors"
                  >
                    <Star className={cn("w-5 h-5", voice.favorite ? "text-amber-400 fill-amber-400" : "text-primary")} />
                  </button>
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-display text-base text-foreground">{voice.name}</p>
                      <span className="px-2 py-0.5 rounded-full bg-elevated border border-border text-[10px] font-semibold text-muted-foreground">
                        {voice.provider === "ELEVENLABS" ? "ElevenLabs" : (SOURCE_LABEL[voice.source] || "Eingesprochen")}
                      </span>
                      {voice.sampleFile && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-semibold">
                          <Mic className="w-3 h-3" /> Eigene Aufnahme
                        </span>
                      )}
                      {voice.public !== false && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-600/20 text-emerald-400 text-[10px] font-semibold">
                          Freigegeben
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {v.label} · Tempo {voice.speed?.toFixed(2) ?? "1.00"}× · Tiefe {voice.depth > 0 ? "+" : ""}{voice.depth ?? 0}
                      {voice.priceCoins > 0 && ` · ${voice.priceCoins} Coins`}
                      {voice.ownerName && ` · ${voice.ownerName}`}
                    </p>
                    {voice.description && <p className="text-xs text-muted-foreground mt-1">{voice.description}</p>}
                    {voice.originNote && <p className="text-xs text-muted-foreground mt-1">Herkunft: {voice.originNote}</p>}
                    {(voice.tags || []).length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {voice.tags.map((t) => (
                          <button key={t} onClick={() => setTagFilter(t)} className="px-2 py-0.5 rounded-full bg-elevated border border-border text-[10px] text-muted-foreground hover:text-foreground">
                            {t}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <VoicePreviewButton profile={voice} onCached={load} />
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <select
                    value={assigned?.id || ""}
                    onChange={(e) => assign(voice, e.target.value)}
                    className="px-3 py-2 rounded-full bg-elevated border border-border text-xs text-muted-foreground focus:outline-none focus:border-primary/50"
                  >
                    <option value="">Keinem Charakter zugeordnet</option>
                    {creators.map((c) => (
                      <option key={c.id} value={c.id}>{c.stageName}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => toggleActive(voice)}
                    className={cn(
                      "px-3 py-2 rounded-full text-xs font-semibold transition-colors",
                      voice.active === false ? "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30" : "bg-elevated border border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {voice.active === false ? "Aktivieren" : "Deaktivieren"}
                  </button>
                  <button
                    onClick={() => togglePublic(voice)}
                    className={cn(
                      "px-3 py-2 rounded-full text-xs font-semibold transition-colors",
                      voice.public !== false ? "bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30" : "bg-elevated border border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {voice.public !== false ? "Freigabe zurücknehmen" : "Freigeben"}
                  </button>
                  <button onClick={() => setEditing(voice)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-elevated border border-border text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Pencil className="w-3.5 h-3.5" /> Bearbeiten
                  </button>
                  <button onClick={() => remove(voice)} className="w-9 h-9 rounded-full bg-destructive/15 text-destructive flex items-center justify-center hover:bg-destructive/25 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}