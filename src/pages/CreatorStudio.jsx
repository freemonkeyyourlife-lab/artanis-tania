import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, LogOut } from "lucide-react";
import { base44 } from "@/api/base44Client";
import Studio from "@/pages/Studio";
import ImportProgressBar from "@/components/studio/ImportProgressBar";

// Das Studio für sich: ohne Menü, ohne Website drumherum — nur die Werkstatt.
export default function CreatorStudio() {
  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 left-0 right-0 z-50 glass-milky" style={{ height: "64px" }}>
        <div className="h-full max-w-[1600px] mx-auto px-4 lg:px-8 flex items-center justify-between gap-4">
          <span className="font-display text-lg font-extrabold text-foreground tracking-wide text-gloss">
            CREATOR <span className="text-primary">STUDIO</span>
          </span>
          <div className="flex items-center gap-2">
            <Link
              to="/studio"
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
        {/* Der Lauf steht hier oben mittig — sichtbar in jedem Bereich des Studios. */}
        <div className="max-w-[1600px] mx-auto px-4 lg:px-8 pt-4 empty:hidden">
          <ImportProgressBar />
        </div>
        <Studio />
      </main>
    </div>
  );
}