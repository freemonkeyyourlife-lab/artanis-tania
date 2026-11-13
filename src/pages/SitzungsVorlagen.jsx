import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Bookmark, Trash2, Loader2, ArrowLeft, Play, Plus, MessageSquare, FileText, Film, Music, Image as ImageIcon, Package } from "lucide-react";
import { THERAPY_MODES, INTENSITIES, roleLabel } from "@/lib/therapyPrompts";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { Image } from "@/components/ui/image";
import VorlagenEditor from "@/components/vorlagen/VorlagenEditor";

const VOICE_LABEL = { storm: "Tief", river: "Ruhig", honey: "Warm", sunny: "Hell", spark: "Schnell" };

const PURPOSES = [
  { value: "SITZUNG", label: "Sitzung", icon: Play },
  { value: "MEDIEN", label: "Medien", icon: Film },
  { value: "CHAT", label: "Chat", icon: MessageSquare },
  { value: "VORSTELLUNG", label: "Vorstellung", icon: FileText },
  { value: "KOMBI", label: "Kombi", icon: Package },
];

const KIND_ICON = { VIDEO: Film, AUDIO: Music, BILD: ImageIcon };

// Vorlagen-Bibliothek: komplette Setups, Mediabündel, Chat-Verweise, freie
// Vorstellungen oder Kombis daraus — mit einem Klick anlegen, überblicken,
// öffnen oder in eine neue Sitzung laden.
export default function SitzungsVorlagen() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [editorOpen, setEditorOpen] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.entities.SzenenVorlage.filter(
        { purpose: { $in: ["SITZUNG", "MEDIEN", "CHAT", "VORSTELLUNG", "KOMBI"] } },
        { sort: "order", limit: 100 }
      );
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
    } catch { /* ignore */ }
  };

  const shown = filter === "ALL" ? items : items.filter((v) => v.purpose === filter);

  return (
    <div className="max-w-[1040px] mx-auto px-4 lg:px-8 py-8">
      <Link to="/therapy" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="w-3.5 h-3.5" /> Sprechstunde
      </Link>

      <div className="flex items-center gap-2 mb-1">
        <Bookmark className="w-5 h-5 text-primary" />
        <p className="text-[11px] font-semibold tracking-wider uppercase text-primary">Bibliothek</p>
      </div>
      <h1 className="font-display text-3xl text-foreground">Vorlagen</h1>
      <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
        Komplette Setups, Mediabündel, Chat-Verweise, freie Vorstellungen oder Kombis daraus.
        Vorhandenes Material wird verlinkt — Videos, Audios, Bilder, Chats — kein Upload nötig.
        Sitzungs-Setups speicherst du direkt aus einer laufenden Sitzung („Als Vorlage“).
      </p>

      <div className="flex items-center gap-2 flex-wrap mt-5">
        <button
          onClick={() => setEditorOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold"
        >
          <Plus className="w-4 h-4" /> Neue Vorlage
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5 mt-5">
        <button
          onClick={() => setFilter("ALL")}
          className={cn("px-3 py-1.5 rounded-full text-xs font-semibold transition-colors", filter === "ALL" ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground")}
        >
          Alle
        </button>
        {PURPOSES.map((p) => {
          const Icon = p.icon;
          return (
            <button
              key={p.value}
              onClick={() => setFilter(p.value)}
              className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors", filter === p.value ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground")}
            >
              <Icon className="w-3.5 h-3.5" /> {p.label}
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 text-muted-foreground animate-spin" /></div>
      ) : shown.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center">
          <Package className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Noch keine Vorlagen. Leg eine an oder speichere ein Setup aus einer Sitzung.</p>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
          {shown.map((v) => (
            <VorlageCard key={v.id} v={v} onStart={startFrom} onRemove={remove} creating={creating === v.id} />
          ))}
        </div>
      )}

      <VorlagenEditor open={editorOpen} onClose={() => setEditorOpen(false)} onSaved={load} />
    </div>
  );
}

function VorlageCard({ v, onStart, onRemove, creating }) {
  const purpose = PURPOSES.find((p) => p.value === v.purpose) || PURPOSES[0];
  const PurposeIcon = purpose.icon;

  return (
    <div className="rounded-2xl border border-border bg-card p-4 flex flex-col">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-[11px] font-semibold flex-shrink-0">
            <PurposeIcon className="w-3.5 h-3.5" /> {purpose.label}
          </span>
          <p className="font-display text-lg text-foreground leading-tight truncate">{v.name}</p>
        </div>
        <button onClick={() => onRemove(v.id)} title="Vorlage löschen" className="rounded-full bg-elevated p-1.5 text-muted-foreground hover:text-destructive flex-shrink-0">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {v.note && <p className="text-xs text-muted-foreground mb-3">{v.note}</p>}

      {(v.purpose === "SITZUNG" || v.purpose === "KOMBI") && v.setup && (
        <SetupSummary v={v} />
      )}

      {(v.purpose === "MEDIEN" || v.purpose === "KOMBI") && (v.media || []).length > 0 && (
        <MediaList media={v.media} />
      )}

      {(v.purpose === "CHAT" || v.purpose === "KOMBI") && (v.chats || []).length > 0 && (
        <div className="mb-3 space-y-1">
          <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">Chats</p>
          {(v.chats || []).map((c) => (
            <Link key={c.id} to="/messages" className="flex items-center gap-2 text-[12px] text-foreground hover:text-primary">
              <MessageSquare className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              <span className="truncate">{c.label}</span>
            </Link>
          ))}
        </div>
      )}

      {(v.purpose === "VORSTELLUNG" || v.purpose === "KOMBI") && v.vorstellung && (
        <div className="mb-3">
          <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground mb-1">Vorstellung</p>
          <p className="text-sm text-foreground/90 whitespace-pre-wrap line-clamp-6">{v.vorstellung}</p>
        </div>
      )}

      {(v.purpose === "SITZUNG" || (v.purpose === "KOMBI" && v.setup)) && (
        <button
          onClick={() => onStart(v)}
          disabled={creating}
          className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
        >
          {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          Neue Sitzung laden
        </button>
      )}

      {v.purpose === "CHAT" && (v.chats || []).length > 0 && (
        <Link to="/messages" className="mt-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
          <MessageSquare className="w-4 h-4" /> Chats öffnen
        </Link>
      )}
    </div>
  );
}

function SetupSummary({ v }) {
  const s = v.setup || {};
  const mode = THERAPY_MODES.find((m) => m.value === s.mode);
  const intensity = INTENSITIES.find((i) => i.value === s.intensity);
  const cast = s.cast || [];
  const present = cast.filter((c) => c.mode === "PRESENT");
  const therapist = s.therapistName || "Tania";
  const fakeSession = { ...s, therapistName: therapist };
  return (
    <div className="mb-3">
      <div className="flex flex-wrap gap-1.5 mb-2">
        <span className="px-2.5 py-1 rounded-full bg-elevated text-muted-foreground text-[11px]">{roleLabel(fakeSession)}</span>
        {mode && <span className="px-2.5 py-1 rounded-full bg-elevated text-muted-foreground text-[11px]">{mode.label}</span>}
        {intensity && <span className="px-2.5 py-1 rounded-full bg-elevated text-muted-foreground text-[11px]">{intensity.label}</span>}
      </div>
      <div className="space-y-1 text-[12px] text-muted-foreground">
        <p><span className="text-foreground font-semibold">{therapist}</span> · Therapeutin · Stimme {VOICE_LABEL[s.therapistVoice] || "Warm"}</p>
        {s.actor?.active && <p><span className="text-foreground font-semibold">{s.actor.name || "Akteur"}</span> · Akteur · Stimme {VOICE_LABEL[s.actor.voice] || "Tief"}</p>}
        {present.map((c) => <p key={c.id}><span className="text-foreground font-semibold">{c.name}</span> · anwesend · Stimme {VOICE_LABEL[c.voice] || "Ruhig"}</p>)}
      </div>
    </div>
  );
}

function MediaList({ media }) {
  return (
    <div className="mb-3 space-y-2">
      <p className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">Medien</p>
      {media.map((m, i) => {
        const Icon = KIND_ICON[m.kind] || Film;
        return (
          <div key={i} className="rounded-xl bg-background/60 p-2">
            <div className="flex items-center gap-2 mb-1.5">
              <Icon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
              <span className="text-[12px] text-foreground font-semibold truncate">{m.title || m.kind}</span>
            </div>
            {m.kind === "VIDEO" && m.url && (
              <video src={m.url} controls className="w-full max-h-52 rounded-lg" />
            )}
            {m.kind === "AUDIO" && m.url && (
              <audio src={m.url} controls className="w-full" />
            )}
            {m.kind === "BILD" && m.url && (
              <Image src={m.url} className="w-full rounded-lg" fittingType="fit" />
            )}
          </div>
        );
      })}
    </div>
  );
}