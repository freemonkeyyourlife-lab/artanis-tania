import React, { useState, useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { MessageSquare, ArrowLeft, Pencil, Video } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import CharacterForm from "@/components/studio/CharacterForm";
import StreamLinkCard from "@/components/creator/StreamLinkCard";
import CharacterGallery from "@/components/creator/CharacterGallery";

export default function CreatorDetail() {
  const { id } = useParams();
  const [creator, setCreator] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    setLoading(true);
    try {
      setCreator(await base44.entities.Creator.get(id));
    } catch (e) {
      console.error(e);
      setCreator(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>;
  }

  if (!creator) {
    return <div className="flex justify-center py-20"><p className="text-muted-foreground">Profil nicht gefunden</p></div>;
  }

  return (
    <div className="max-w-[1000px] mx-auto px-4 lg:px-8 py-8">
      <Link to="/messages" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Zurück zum Chat
      </Link>

      {editing && (
        <div className="mb-6">
          <CharacterForm
            initial={creator}
            onSaved={() => { setEditing(false); load(); }}
            onCancel={() => setEditing(false)}
          />
        </div>
      )}

      <div className="rounded-2xl overflow-hidden border border-border bg-card">
        <div className="relative aspect-[16/10] sm:aspect-[16/7]">
          {/* Weichgezeichneter Hintergrund füllt die Fläche, das Bild selbst steht komplett drin — Kopf ist immer zu sehen. */}
          <Image src={creator.banner || creator.avatar} fittingType="fill" className="absolute inset-0 w-full h-full scale-125 blur-2xl opacity-70" />
          <Image src={creator.banner || creator.avatar} fittingType="fit" className="absolute inset-0 w-full h-full" />
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
          <div className="absolute top-4 left-4"><StatusBadge status={creator.onlineStatus} /></div>
        </div>

        <div className="px-6 pb-6 -mt-16 relative">
          <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-border bg-card">
            {/* Ausschnitt nach oben gezogen — das Gesicht ist im runden Rahmen zu sehen, nicht der Bauch. */}
            <Image src={creator.avatar} fittingType="fill" focalPointX={0.5} focalPointY={0.12} className="w-full h-full" />
          </div>
          <h1 className="font-display text-3xl text-foreground mt-4">{creator.stageName}</h1>
          {creator.tagline && <p className="text-primary text-sm mt-1">{creator.tagline}</p>}
          <StreamLinkCard url={creator.streamUrl} name={creator.stageName} />
          {creator.bio && <p className="text-sm text-muted-foreground mt-3 max-w-2xl whitespace-pre-line">{creator.bio}</p>}

          {creator.topics?.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-4">
              {creator.topics.map((t, i) => (
                <span key={i} className="px-3 py-1.5 rounded-full bg-elevated border border-border text-xs text-muted-foreground">{t}</span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-3 mt-6">
            <Link to="/messages" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold">
              <MessageSquare className="w-4 h-4" /> Nachricht schreiben
            </Link>
            <Link to={`/ai-call/${creator.id}`} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-elevated border border-border text-foreground text-sm font-semibold hover:border-primary/30 transition-all">
              <Video className="w-4 h-4" /> Videochat — jederzeit anrufbar
            </Link>
            <button
              onClick={() => setEditing(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-elevated border border-border text-foreground text-sm font-semibold hover:border-primary/30 transition-all"
            >
              <Pencil className="w-4 h-4" /> Bearbeiten
            </button>
          </div>
        </div>
      </div>

      <CharacterGallery creatorId={creator.id} />
    </div>
  );
}