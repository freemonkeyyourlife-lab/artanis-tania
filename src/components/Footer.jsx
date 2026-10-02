import React from "react";
import { Link } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import BrandWordmark from "@/components/BrandWordmark";
import { LEGAL_PAGES } from "@/lib/legalTexts";

// Die Fußzeile: die Rechtstexte sind von jeder Seite aus erreichbar.
export default function Footer() {
  return (
    <footer className="relative z-10 mt-10 border-t-2 border-border/60 pb-28 lg:pb-8 pt-8">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-8 flex flex-col items-center gap-4 text-center">
        <BrandWordmark className="text-base text-foreground" />
        <nav className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2">
          {LEGAL_PAGES.map((p) => (
            <Link
              key={p.id}
              to={`/recht/${p.id}`}
              className="text-[13px] font-bold text-muted-foreground hover:text-primary transition-colors"
            >
              {p.label}
            </Link>
          ))}
        </nav>
        <p className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/15 text-primary text-[12px] font-bold">
          <ShieldCheck className="w-3.5 h-3.5" /> Nur für Erwachsene ab 18 Jahren
        </p>
      </div>
    </footer>
  );
}