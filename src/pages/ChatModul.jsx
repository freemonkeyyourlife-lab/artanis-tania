import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Settings2, Smartphone } from "lucide-react";
import ChatModuleWindow from "@/components/chatmodul/ChatModuleWindow";
import ChatModuleSettings from "@/components/chatmodul/ChatModuleSettings";

// Das Chat-Modul: eigenständig, ohne Rahmen der Plattform — damit es sich als
// App installieren und mit ?embed=1 in eine fremde Seite hängen lässt.
export default function ChatModul() {
  const location = useLocation();
  const embed = new URLSearchParams(location.search).get("embed") === "1";
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {!embed && (
        <header className="glass-milky sticky top-0 z-20">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
            <Link to="/" className="flex items-center gap-2 text-sm font-bold hover:text-primary">
              <ArrowLeft className="h-4 w-4" /> Zurück
            </Link>
            <div className="font-heading text-sm">Chat-Modul</div>
            <button
              onClick={() => setSettingsOpen((o) => !o)}
              className="glass-btn flex h-9 items-center gap-2 rounded-full px-3 text-xs font-bold"
            >
              <Settings2 className="h-4 w-4" /> Einstellungen
            </button>
          </div>
        </header>
      )}

      <main className="mx-auto max-w-3xl px-4 py-4">
        {settingsOpen && !embed && (
          <div className="mb-4">
            <ChatModuleSettings />
          </div>
        )}
        <ChatModuleWindow />
        {!embed && (
          <p className="mt-4 flex items-start gap-2 text-xs text-muted-foreground">
            <Smartphone className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Als App installieren: im Browser „Zum Startbildschirm hinzufügen" wählen. Mit{" "}
              <code>?embed=1</code> läuft dasselbe Fenster ohne Kopfzeile in einer fremden Seite.
            </span>
          </p>
        )}
      </main>
    </div>
  );
}