import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Bookmark, Trash2, Loader2, Sparkles, ArrowLeft, Play } from "lucide-react";
import { THERAPY_MODES, INTENSITIES, roleLabel, therapistName } from "@/lib/therapyPrompts";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";

const VOICE_LABEL = { storm: "Tief", river: "Ruhig", honey: "Warm", sunny: "Hell", spark: "Schnell" };

// Bibliothek der Sitzungs-Vorlagen: komplette Setups — Rollen, Stimmen, Modus,
// Intensität, Besetzung — mit einem Klick in eine neue Sitzung laden.
export default function SitzungsVorlagen() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.entities.SzenenVorlage.filter({ purpose: "SITZUNG" }, { sort: "order", limit: 100 });
      setItems(res.items || []);
    } catch {
      /* noch keine Vorlagen */
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const startFrom = async (v) => {
    const s = v.setup || {};
    setCreating(v.id);
    try {
      const me = await base44.auth.me();
      const session = await base44.entities.TherapySession.create({
        userId: me.id,
        userName: me.full_name || me.email,
        roleSetup: s.roleSetup || "TANIA_THERAPIST",
        mode: s.mode || "GUIDED",
        intensity: s.intensity || "TIEF",
        therapistVoice: s.therapistVoice || "honey",
        therapistName: s.therapistName || "Tania",
        therapistAge: s.therapistAge,
        therapistType: s.therapistType,
        therapistStyle: s.therapistStyle,
        therapistRole: s.therapistRole,
        cast: s.cast || [],
        actor: s.actor || undefined,
        topic: s.topic || `Aus Vorlage: ${v.name}`,
        visibility: "PUBLIC",
        status: "OPEN",
      });
      navigate(`/therapy/${session.id}`);
    } catch (e) {
      toast({ variant: "destructive", title: "Sitzung konnte nicht gestartet werden", description: e?.message });
      setCreating(null);
    }
  };

  const remove = async (id) => {
    try {
      await base44.entities.SzenenVorlage.delete(id);
      setItems((xs) => xs.filter((x) => x.id !== id));
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="max-w-[1000px] mx-auto px-4 lg:px-8 py-8">
      <Link to="/therapy" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Sprechstunde
      </Link>

      <div className="flex items-center gap-2 mb-1">
        <Bookmark className="w-5 h-5 text-primary" />
        <p className="text-[11px] font-semibold tracking-wider uppercase text-primary">Bibliothek</p>
      </div>
      <h1 className="font-display text-3xl text-foreground">Sitzungs-Vorlagen</h1>
      <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
        Komplette Setups — Rollen, Stimmen, Modus, Intensität, Besetzung — mit einem Klick in eine neue Sitzung laden.
        Speichere ein Setup direkt aus einer laufenden Sitzung (Knopf „Als Vorlage“).
      </p>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center">
          <Sparkles className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Noch keine Vorlagen. Öffne eine Sitzung und speichere ihr Setup mit „Als Vorlage“.</p>
          <Link to="/therapy" className="inline-flex mt-4 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold">Zur Sprechstunde</Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          {items.map((v) => {
            const s = v.setup || {};
            const mode = THERAPY_MODES.find((m) => m.value === s.mode);
            const intensity = INTENSITIES.find((i) => i.value === s.intensity);
            const cast = s.cast || [];
            const present = cast.filter((c) => c.mode === "PRESENT");
            const therapist = s.therapistName || "Tania";
            const fakeSession = { ...s, therapistName: therapist };
            return (
              <div key={v.id} className="rounded-2xl border border-border bg-card p-4 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-display text-lg text-foreground leading-tight">{v.name}</p>
                  <button onClick={() => remove(v.id)} title="Vorlage löschen" className="rounded-full bg-elevated p-1.5 text-muted-foreground hover:text-destructive flex-shrink-0">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="px-2.5 py-1 rounded-full bg-primary/15 text-primary text-[11px] font-semibold">{roleLabel(fakeSession)}</span>
                  {mode && <span className="px-2.5 py-1 rounded-full bg-elevated text-muted-foreground text-[11px]">{mode.label}</span>}
                  {intensity && <span className="px-2.5 py-1 rounded-full bg-elevated text-muted-foreground text-[11px]">{intensity.label}</span>}
                </div>

                <div className="space-y-1.5 text-[12px] text-muted-foreground mb-3">
                  <p><span className="text-foreground font-semibold">{therapist}</span> · Therapeutin · Stimme {VOICE_LABEL[s.therapistVoice] || "Warm"}</p>
                  {s.actor?.active && (
                    <p><span className="text-foreground font-semibold">{s.actor.name || "Akteur"}</span> · Akteur · Stimme {VOICE_LABEL[s.actor.voice] || "Tief"}</p>
                  )}
                  {present.map((c) => (
                    <p key={c.id}><span className="text-foreground font-semibold">{c.name}</span> · {c.mode === "PRESENT" ? "anwesend" : "informiert"} · Stimme {VOICE_LABEL[c.voice] || "Ruhig"}</p>
                  ))}
                </div>

                <button
                  onClick={() => startFrom(v)}
                  disabled={creating === v.id}
                  className={cn("mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50")}
                >
                  {creating === v.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                  Neue Sitzung laden
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}