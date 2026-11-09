import React, { useEffect, useState } from "react";
import { Outlet, Link, useLocation, Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, Lock, Share2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import PartnerInvite from "@/components/private/PartnerInvite";

// Privates Layout für den Bau- und Trainingsbereich: nur Besitzerin (admin).
// Nicht-Admins sehen einen Hinweis statt der Werkzeuge — strikte Trennung
// vom öffentlichen App-Verkehr, damit du in Ruhe basteln kannst.
// Nicht angemeldete Besucher wandern direkt zum Login und kommen danach
// genau auf die Funktion zurück, deren Link sie geöffnet haben.

export default function PrivateBuild() {
  const location = useLocation();
  const { toast } = useToast();
  const [me, setMe] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth
      .me()
      .then((u) => setMe(u))
      .catch(() => setMe(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Nicht angemeldet → zum Login, danach zurück genau hierher (Deep-Link).
  if (!me) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/login?returnTo=${returnTo}`} replace />;
  }

  if (me.role !== "admin") {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Lock className="mx-auto h-9 w-9 text-muted-foreground" />
        <h1 className="mt-3 font-display text-2xl text-foreground">Privater Bereich</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Trainings, Modelle und Charaktere baust du ungestört — nur für die Besitzerin. Du bist angemeldet, aber kein Admin.
        </p>
        <Link to="/" className="mt-4 inline-block text-sm text-primary">Zur Startseite</Link>
      </div>
    );
  }

  // Direkt-Link zu genau dieser Funktion kopieren — wer ihn öffnet, landet
  // nach dem Login hierher, nicht auf der Startseite.
  const shareLink = async () => {
    const url = `${window.location.origin}${location.pathname}${location.search}`;
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link kopiert", description: "Nach dem Login landet sie genau auf dieser Funktion." });
    } catch {
      toast({ variant: "destructive", title: "Nicht kopiert", description: url });
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur relative">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-3">
          <span className="font-display text-lg text-foreground">Privat</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Trainings-, Modell- und Charakter-Bereich — abgetrennt vom öffentlichen Verkehr
          </span>
          <div className="ml-auto flex items-center gap-2 text-xs">
            <PartnerInvite />
            <button onClick={shareLink} className="inline-flex items-center gap-1 rounded-full bg-elevated px-3 py-1.5 text-muted-foreground hover:text-foreground">
              <Share2 className="h-3.5 w-3.5" /> Link zu dieser Funktion
            </button>
            <Link to="/studio-hilfe" className="rounded-full bg-elevated px-3 py-1.5 text-muted-foreground hover:text-foreground">
              Hilfe
            </Link>
            <Link to="/schnittstelle" className="rounded-full bg-elevated px-3 py-1.5 text-muted-foreground hover:text-foreground">
              Schnittstelle
            </Link>
            <Link to="/werkstatt" className="rounded-full bg-primary px-3 py-1.5 font-semibold text-primary-foreground">
              Werkstatt
            </Link>
            <Link to="/" className="rounded-full bg-elevated px-3 py-1.5 text-muted-foreground hover:text-foreground">
              Zur öffentlichen Seite
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4">
        <Outlet />
      </main>
    </div>
  );
}