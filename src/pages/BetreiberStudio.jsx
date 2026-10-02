import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Crown, LayoutGrid, LogOut, Users, Wand2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import OperatorGate from "@/components/studio/OperatorGate";
import SiteEditorPanel from "@/components/studio/SiteEditorPanel";
import GodModePanel from "@/components/studio/GodModePanel";
import ViewAsSwitch from "@/components/owner/ViewAsSwitch";
import UserSwitcher from "@/components/owner/UserSwitcher";

const TABS = [
  { id: "seiten", label: "Seiten & Leiste", icon: LayoutGrid },
  { id: "god", label: "God-Mode", icon: Wand2 },
  { id: "nutzer", label: "Nutzerwechsel", icon: Users },
];

// Das Studio für sich: ohne Menü und ohne Website drumherum — nur die Werkstatt.
// Hinein kommt ausschließlich der Betreiber.
export default function BetreiberStudio() {
  const [me, setMe] = useState(undefined);
  const [tab, setTab] = useState("seiten");

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => setMe(null));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 glass-milky" style={{ height: "64px" }}>
        <div className="h-full max-w-[1600px] mx-auto px-4 lg:px-8 flex items-center justify-between gap-4">
          <span className="font-display text-lg font-extrabold text-foreground tracking-wide text-gloss">
            BETREIBER <span className="text-primary">STUDIO</span>
          </span>
          <div className="flex items-center gap-2">
            <Link
              to="/owner"
              className="hidden sm:inline-flex items-center gap-2 px-5 py-2 rounded-full glass-btn text-[14px] font-bold text-foreground"
            >
              <Crown className="w-4 h-4 text-primary" /> Besitzer-Konsole
            </Link>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass-btn text-[14px] font-bold text-foreground"
            >
              <ArrowLeft className="w-4 h-4" /> Zur Website
            </Link>
            <button
              onClick={() => base44.auth.logout("/")}
              title="Abmelden"
              className="w-9 h-9 rounded-full glass-btn flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="pt-[64px]">
        <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-8">
          {me === undefined ? (
            <div className="flex justify-center py-24">
              <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
            </div>
          ) : !me || me.role !== "admin" ? (
            <OperatorGate />
          ) : (
            <>
              <h1 className="font-display text-4xl text-foreground text-gloss">Dein Studio</h1>
              <p className="text-[15px] font-semibold text-muted-foreground mt-2 max-w-3xl leading-relaxed">
                Hier steht die App zum Umbauen: die Seiten, die Leiste oben, der God-Mode und der Blick als Nutzer.
                Alles wirkt sofort und lässt sich genauso schnell zurückdrehen.
              </p>

              <div className="glass flex flex-wrap gap-1 p-1.5 rounded-2xl border border-border w-fit my-6">
                {TABS.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTab(t.id)}
                      className={cn(
                        "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-[15px] font-bold whitespace-nowrap transition-colors",
                        tab === t.id ? "glass-btn glass-btn-accent text-gloss" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <Icon className="w-4 h-4" /> {t.label}
                    </button>
                  );
                })}
              </div>

              {tab === "seiten" && <SiteEditorPanel />}

              {tab === "god" && <GodModePanel />}

              {tab === "nutzer" && (
                <div className="space-y-5">
                  <ViewAsSwitch />
                  <UserSwitcher me={me} />
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}