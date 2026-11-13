import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Plus, X, Archive as ArchiveIcon, Bookmark } from "lucide-react";
import SessionForm from "@/components/therapy/SessionForm";
import SessionCard from "@/components/therapy/SessionCard";
import SessionsOverview from "@/components/therapy/SessionsOverview";

export default function Therapy() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [mine, setMine] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [me, setMe] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const user = await base44.auth.me().catch(() => null);
        setMe(user);
        const [publicOnes, ownOnes] = await Promise.all([
          base44.entities.TherapySession.filter({ visibility: "PUBLIC" }, "-created_date", 30),
          user ? base44.entities.TherapySession.filter({ userId: user.id }, "-created_date", 30) : Promise.resolve([]),
        ]);
        setSessions(publicOnes);
        setMine(ownOnes);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1100px] mx-auto px-4 lg:px-8 py-8">
      <div className="mb-6">
        <p className="text-[11px] font-semibold tracking-wider uppercase text-primary mb-2">Sprechstunde</p>
        <h1 className="font-display text-3xl text-foreground">Sexualtherapie</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          Eine Couch, kein Smalltalk. Du baust die Sitzung: welche Therapeutin (oder deine eigene, mit Foto),
          das Thema, den Ablauf, wie sie antwortet, wer mit im Raum ist, wo ihr seid und was vereinbart ist.
          Als Einzelsitzung oder als Serie. Wer will, lässt andere mitlesen — oder live zuschauen.
        </p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold"
          >
            <Plus className="w-4 h-4" /> Neue Sitzung
          </button>
        ) : null}
        <Link
          to="/therapy-archiv"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-elevated border border-border text-foreground text-sm font-semibold hover:border-primary/50 transition-colors"
        >
          <ArchiveIcon className="w-4 h-4" /> Archiv
        </Link>
        <Link
          to="/sitzungs-vorlagen"
          className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-elevated border border-border text-foreground text-sm font-semibold hover:border-primary/50 transition-colors"
        >
          <Bookmark className="w-4 h-4" /> Vorlagen
        </Link>
      </div>

      {showForm && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-foreground">Neue Sitzung anlegen</p>
            <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-full bg-elevated flex items-center justify-center text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <SessionForm onCreated={(s) => navigate(`/therapy/${s.id}`)} />
        </div>
      )}

      {mine.length > 0 && (
        <section className="mt-10">
          <h2 className="font-display text-xl text-foreground mb-3">Deine Sitzungen</h2>
          <SessionsOverview sessions={mine} />
        </section>
      )}

      <section className="mt-10">
        <h2 className="font-display text-xl text-foreground mb-3">Sitzungen zum Mitlesen</h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground">Noch keine offenen Sitzungen. Sei der Erste.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sessions.map((s) => (
              <SessionCard key={s.id} session={s} own={me && s.userId === me.id} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}