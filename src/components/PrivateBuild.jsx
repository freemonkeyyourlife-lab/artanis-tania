import React, { useEffect, useState } from "react";
import { Outlet, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2, Lock } from "lucide-react";

// Privates Layout für den Bau- und Trainingsbereich: nur Besitzerin (admin).
// Nicht-Admins sehen einen Hinweis statt der Werkzeuge — strikte Trennung
// vom öffentlichen App-Verkehr, damit du in Ruhe basteln kannst.

export default function PrivateBuild() {
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

  if (!me || me.role !== "admin") {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Lock className="mx-auto h-9 w-9 text-muted-foreground" />
        <h1 className="mt-3 font-display text-2xl text-foreground">Privater Bereich</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Trainings, Modelle und Charaktere baust du ungestört — nur für die Besitzerin. Melde dich als Admin an.
        </p>
        <Link to="/" className="mt-4 inline-block text-sm text-primary">Zur Startseite</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-3">
          <span className="font-display text-lg text-foreground">Privat</span>
          <span className="text-xs text-muted-foreground hidden sm:inline">
            Trainings-, Modell- und Charakter-Bereich — abgetrennt vom öffentlichen Verkehr
          </span>
          <div className="ml-auto flex items-center gap-2 text-xs">
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