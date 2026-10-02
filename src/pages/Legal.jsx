import React from "react";
import { Link, useParams } from "react-router-dom";
import { ShieldCheck, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { LEGAL_PAGES, LEGAL_NOTICE, LEGAL_STAND, legalPage } from "@/lib/legalTexts";

// Die Rechtstexte — als eigene Seiten, von überall über die Fußzeile erreichbar.
export default function Legal() {
  const { section } = useParams();
  const page = legalPage(section);

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 py-8 lg:py-14">
      <div className="flex items-center gap-2 mb-6">
        <ShieldCheck className="w-5 h-5 text-primary" />
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Rechtliches</p>
      </div>

      <h1 className="font-display text-3xl lg:text-5xl text-foreground text-gloss mb-3">
        {page ? page.title : "Rechtliches"}
      </h1>
      {page?.lead && <p className="text-[15px] font-semibold text-muted-foreground mb-5">{page.lead}</p>}

      <div className="rounded-2xl border-2 border-primary/40 bg-primary/10 p-4 mb-8">
        <p className="text-[13px] font-bold text-foreground">{LEGAL_NOTICE}</p>
      </div>

      {!page && (
        <p className="text-[15px] font-semibold text-muted-foreground mb-6">
          Wähle einen Text aus:
        </p>
      )}

      {page && (
        <article className="space-y-7">
          {page.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="font-display text-lg lg:text-xl text-foreground mb-2">{s.heading}</h2>
              {s.body?.map((p, i) => (
                <p key={i} className="text-[15px] font-medium text-muted-foreground leading-relaxed mb-2">
                  {p}
                </p>
              ))}
              {s.list && (
                <ul className="mt-2 space-y-1.5">
                  {s.list.map((item, i) => (
                    <li key={i} className="flex gap-2 text-[15px] font-medium text-muted-foreground leading-relaxed">
                      <span className="text-primary flex-shrink-0">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
          <p className="text-[13px] font-semibold text-muted-foreground">Stand: {LEGAL_STAND}</p>
        </article>
      )}

      <div className="mt-10 pt-6 border-t-2 border-border">
        <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Alle Rechtstexte
        </p>
        <div className="flex flex-wrap gap-2">
          {LEGAL_PAGES.map((p) => (
            <Link
              key={p.id}
              to={`/recht/${p.id}`}
              className={cn(
                "px-4 py-2 rounded-full text-[13px] font-bold transition-colors",
                p.id === page?.id ? "glass-btn glass-btn-accent text-gloss" : "glass-btn text-foreground"
              )}
            >
              {p.label}
            </Link>
          ))}
        </div>
        <Link
          to="/"
          className="mt-5 inline-flex items-center gap-2 text-[14px] font-bold text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" /> Zurück zur Startseite
        </Link>
      </div>
    </div>
  );
}