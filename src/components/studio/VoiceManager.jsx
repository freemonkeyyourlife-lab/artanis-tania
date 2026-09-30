import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Mic, Pencil, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveVoice } from "@/lib/voiceDj";
import VoiceForm from "@/components/studio/VoiceForm";
import VoicePreviewButton from "@/components/voice/VoicePreviewButton";

export default function VoiceManager() {
  const [voices, setVoices] = useState([]);
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);

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

  // Eine Stimme gehört immer nur einem Charakter — vorher beim alten lösen.
  const assign = async (voice, creatorId) => {
    const previous = creators.filter((c) => c.voiceProfileId === voice.id && c.id !== creatorId);
    for (const c of previous) {
      await base44.entities.Creator.update(c.id, { voiceProfileId: "" });
    }
    if (creatorId) await base44.entities.Creator.update(creatorId, { voiceProfileId: voice.id });
    load();
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setEditing("new")}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold whitespace-nowrap"
        >
          <Plus className="w-4 h-4" /> Neue Stimme
        </button>
      </div>

      {editing && (
        <div className="mb-8">
          <VoiceForm
            initial={editing === "new" ? null : editing}
            onSaved={() => { setEditing(null); load(); }}
            onCancel={() => setEditing(null)}
          />
        </div>
      )}

      {voices.length === 0 ? (
        <p className="text-muted-foreground text-center py-16">Noch keine Stimmen — sprich deine erste ein oder leg eine Grundstimme an.</p>
      ) : (
        <div className="space-y-3">
          {voices.map((voice) => {
            const assigned = creators.find((c) => c.voiceProfileId === voice.id);
            const v = resolveVoice(voice);
            return (
              <div key={voice.id} className={cn("rounded-2xl border border-border bg-card p-4", voice.active === false && "opacity-60")}>
                <div className="flex flex-wrap items-start gap-4">
                  <div className="w-11 h-11 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                    <Mic className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <p className="font-display text-base text-foreground">{voice.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {v.label} · Tempo {voice.speed?.toFixed(2) ?? "1.00"}× · Tiefe {voice.depth > 0 ? "+" : ""}{voice.depth ?? 0}
                      {voice.priceCoins > 0 && ` · ${voice.priceCoins} Coins`}
                    </p>
                    {voice.description && <p className="text-xs text-muted-foreground mt-1">{voice.description}</p>}
                    {voice.sampleFile && <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-elevated border border-border text-[10px] text-muted-foreground">Eigene Aufnahme hinterlegt</span>}
                  </div>
                  <VoicePreviewButton profile={voice} />
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <select
                    value={assigned?.id || ""}
                    onChange={(e) => assign(voice, e.target.value)}
                    className="px-3 py-2 rounded-full bg-elevated border border-border text-xs text-muted-foreground focus:outline-none focus:border-primary/50"
                  >
                    <option value="">Keinem Charakter zugeordnet</option>
                    {creators.filter((c) => c.stageName !== "Testdummy").map((c) => (
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