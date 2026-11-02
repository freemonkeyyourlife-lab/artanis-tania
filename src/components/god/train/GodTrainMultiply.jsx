import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Sparkles } from "lucide-react";
import { signMedia } from "@/lib/mediaSign";

// Vervielfältigung: Sets mit zu wenig Bildern auffüllen, indem die
// Bildgenerierung aus dem ersten Bild neue Varianten derselben Person macht.
export default function GodTrainMultiply() {
  const [sets, setSets] = useState([]);
  const [busy, setBusy] = useState(null);
  const [log, setLog] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const s = await base44.entities.TrainingSet.filter({}, { sort: "-created_date", limit: 100 });
      setSets(s.items || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load().catch(() => setLoading(false)); }, []);

  const under = sets.filter((s) => (s.images?.length || 0) + (s.generatedImages?.length || 0) < (s.targetCount || 12));

  const note = (m) => setLog((l) => [...l.slice(-8), m]);

  // Ein Set auffüllen: so lange neue Bilder erzeugen, bis das Ziel erreicht ist.
  const fill = async (set) => {
    setBusy(set.id);
    try {
      let generated = [...(set.generatedImages || [])];
      const have = (set.images?.length || 0) + generated.length;
      const target = set.targetCount || 12;
      const need = Math.max(0, target - have);
      if (!need) return;
      const ref = (set.images || [])[0] || generated[0];
      const refUrls = ref ? [await signMedia(ref)] : [];
      note(`${set.personName}: ${need} Bild(er) erzeugen …`);
      for (let i = 0; i < need; i += 1) {
        const res = await base44.integrations.Core.GenerateImage({
          prompt: `Porträt einer Person namens ${set.personName}. Neue Pose, gleiche Person, fotorealistisch, neutraler Hintergrund, gleiches Licht. Erwachsene Person, keine realen Personen.`,
          existing_image_urls: refUrls,
        });
        if (res?.url) generated.push(res.url);
      }
      await base44.entities.TrainingSet.update(set.id, {
        generatedImages: generated,
        status: (set.images?.length || 0) + generated.length >= target ? "BEREIT" : "SAMMLUNG",
      });
      note(`${set.personName}: aufgefüllt.`);
      await load();
    } catch (e) {
      note("Fehler: " + (e?.message || "?"));
    } finally {
      setBusy(null);
    }
  };

  const fillAll = async () => {
    for (const s of under) { await fill(s); }
  };

  if (loading) return <p className="text-[13px] text-muted-foreground">Lädt …</p>;

  return (
    <div className="flex flex-col gap-3">
      <button onClick={fillAll} disabled={!!busy || !under.length} className="glass-btn glass-btn-accent inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[13px] font-bold disabled:opacity-50 self-start">
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Alle auffüllen ({under.length})
      </button>
      {under.length === 0 ? <p className="text-[13px] text-muted-foreground">Alle Sets sind voll.</p> : under.map((s) => {
        const have = (s.images?.length || 0) + (s.generatedImages?.length || 0);
        const miss = (s.targetCount || 12) - have;
        return (
          <div key={s.id} className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2 bg-elevated">
            <div className="min-w-0">
              <p className="text-[13px] font-bold text-foreground truncate">{s.personName}</p>
              <p className="text-[11px] text-muted-foreground">{have}/{s.targetCount || 12} — {miss} fehlen</p>
            </div>
            <button onClick={() => fill(s)} disabled={!!busy} className="glass-btn inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold disabled:opacity-50">
              {busy === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />} Auffüllen
            </button>
          </div>
        );
      })}
      {log.length > 0 && (
        <div className="rounded-xl bg-background border border-border p-3 max-h-40 overflow-y-auto">
          {log.map((l, i) => <p key={i} className="text-[12px] text-foreground whitespace-pre-wrap">{l}</p>)}
        </div>
      )}
    </div>
  );
}