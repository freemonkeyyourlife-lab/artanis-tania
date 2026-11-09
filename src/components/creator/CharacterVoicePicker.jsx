import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Mic, Play, Pause, Loader2, Link2, Check, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

// Stimmen-Panel auf dem Charakter-Profil (nur für die Besitzerin): hängt eine
// bereits erzeugte Stimme aus der Stimmbank an den Charakter (voiceProfileId),
// spielt die Probe vor und legt per direkter Audio-URL eine neue Stimme an.
// Keine Fremd-Seite wird gescrappt — nur direkte Audio-Links.

const resolveUrl = async (u) => {
  if (!u) return null;
  if (u.startsWith("http")) return u;
  try {
    const r = await base44.integrations.Core.CreateFileSignedUrl({ file_uri: u });
    return r?.signed_url || null;
  } catch {
    return null;
  }
};

export default function CharacterVoicePicker({ creator, onSaved }) {
  const { toast } = useToast();
  const [me, setMe] = useState(null);
  const [voices, setVoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState(null);
  const [urlInput, setUrlInput] = useState("");
  const [urlName, setUrlName] = useState("");
  const [adding, setAdding] = useState(false);
  const audioRef = useRef(null);
  const [audioUrl, setAudioUrl] = useState("");

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => setMe(null));
  }, []);

  useEffect(() => {
    if (!me || me.role !== "admin") return;
    base44.entities.Voice.filter({ active: true }, "-created_date", 50)
      .then((rows) => setVoices(Array.isArray(rows) ? rows : []))
      .catch(() => setVoices([]))
      .finally(() => setLoading(false));
  }, [me]);

  // Aktuell angehängte Stimme finden (auch wenn sie nicht mehr in der Liste steht).
  const current = voices.find((v) => v.id === creator.voiceProfileId) ||
    (creator.voiceProfileId ? { id: creator.voiceProfileId, name: "ANGEHÄNGTE STIMME", baseVoice: creator.voice } : null);

  const attach = async (v) => {
    try {
      await base44.entities.Creator.update(creator.id, {
        voiceProfileId: v.id,
        voice: v.baseVoice || creator.voice || "honey",
      });
      toast({ title: "Stimme angehängt", description: v.name });
      onSaved?.();
    } catch (e) {
      toast({ variant: "destructive", title: "Fehlgeschlagen", description: e?.message });
    }
  };

  const play = async (v) => {
    if (playingId === v.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    const url = await resolveUrl(v.sampleFile || v.sourceUrl);
    if (!url) {
      toast({ variant: "destructive", title: "Keine Probe", description: "Diese Stimme hat keine Audio-Datei." });
      return;
    }
    setAudioUrl(url);
    setPlayingId(v.id);
    setTimeout(() => audioRef.current?.play().catch(() => {}), 50);
  };

  const addByUrl = async () => {
    const url = urlInput.trim();
    const name = urlName.trim() || `Import ${new Date().toLocaleDateString()}`;
    if (!url) return;
    if (!/^https?:\/\//.test(url)) {
      toast({ variant: "destructive", title: "URL fehlt", description: "Eine direkte Audio-URL (https://…)." });
      return;
    }
    setAdding(true);
    try {
      const created = await base44.entities.Voice.create({
        name,
        sourceUrl: url,
        sampleFile: url,
        provider: "GRUNDSTIMME",
        source: "HOCHGELADEN",
        ownerName: creator.stageName,
        active: true,
      });
      await attach(created);
      setVoices((vs) => [created, ...vs]);
      setUrlInput("");
      setUrlName("");
      toast({ title: "Stimme angelegt", description: name });
    } catch (e) {
      toast({ variant: "destructive", title: "Fehlgeschlagen", description: e?.message });
    } finally {
      setAdding(false);
    }
  };

  if (!me || me.role !== "admin") return null;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 mt-6">
      <h3 className="font-display text-lg text-foreground flex items-center gap-2 mb-1">
        <Mic className="w-5 h-5 text-primary" /> Stimme
      </h3>
      <p className="text-xs text-muted-foreground mb-4">
        Hänge eine Stimme aus deiner Stimmbank an diesen Charakter — oder lege per direkter Audio-URL eine neue an.
      </p>

      {current && (
        <div className="mb-4 flex items-center gap-3 rounded-xl bg-elevated p-3">
          <button onClick={() => play(current)} className="glass-btn glass-btn-accent inline-flex h-10 w-10 items-center justify-center rounded-full">
            {playingId === current.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground truncate">{current.name}</p>
            <p className="text-[11px] text-muted-foreground">Aktuelle Stimme · {current.baseVoice || "—"}</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-1 text-[10px] font-bold text-emerald-300">
            <Check className="w-3 h-3" /> angehängt
          </span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted-foreground py-4"><Loader2 className="w-4 h-4 animate-spin" /> Lade Stimmbank …</div>
      ) : voices.length === 0 ? (
        <p className="text-xs text-muted-foreground py-4">Noch keine Stimmen in der Stimmbank. Lege unten per URL eine an.</p>
      ) : (
        <div className="max-h-64 space-y-2 overflow-y-auto scrollbar-hide pr-1">
          {voices.map((v) => {
            const attached = v.id === creator.voiceProfileId;
            return (
              <div key={v.id} className="flex items-center gap-3 rounded-xl bg-elevated p-2.5">
                <button onClick={() => play(v)} className="glass-btn inline-flex h-9 w-9 items-center justify-center rounded-full">
                  {playingId === v.id ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-foreground truncate">{v.name}</p>
                  <p className="text-[11px] text-muted-foreground truncate">{v.baseVoice || v.provider} {v.mood ? `· ${v.mood}` : ""}</p>
                </div>
                <button onClick={() => attach(v)} disabled={attached}
                  className={cn("inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold", attached ? "bg-emerald-500/15 text-emerald-300" : "glass-btn glass-btn-accent")}>
                  {attached ? <><Check className="w-3.5 h-3.5" /> Dran</> : "Anhängen"}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Von URL: direkte Audio-Link → neue Stimme → anhängen. */}
      <div className="mt-4 rounded-xl border border-border bg-background p-3">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Link2 className="w-3.5 h-3.5" /> Per Audio-URL neu anlegen
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input value={urlName} onChange={(e) => setUrlName(e.target.value)} placeholder="Name (optional)" className="flex-1 rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground" />
          <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="https://…/stimme.mp3" className="flex-1 rounded-lg border border-border bg-elevated px-3 py-2 text-sm text-foreground" />
          <button onClick={addByUrl} disabled={adding || !urlInput.trim()}
            className="glass-btn glass-btn-accent inline-flex items-center justify-center gap-1 rounded-lg px-4 py-2 text-sm font-bold disabled:opacity-50">
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Anlegen & anhängen
          </button>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={() => setPlayingId(null)}
        preload="none"
      />
    </div>
  );
}