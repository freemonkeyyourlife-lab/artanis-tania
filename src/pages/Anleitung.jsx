import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { KeyRound, MessageSquare } from "lucide-react";
import { SECTIONS, FIND_SPOTS } from "@/lib/guideContent";

// Zum Nachschlagen: wie alles zusammenhängt — Schritt für Schritt, mit den
// genauen Stellen in der App. Nur für den Besitzer.

export default function Anleitung() {
  const [me, setMe] = useState(undefined);

  useEffect(() => {
    base44.auth.me().then(setMe).catch(() => setMe(null));
  }, []);

  if (me === undefined) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!me || me.role !== "admin") {
    return (
      <div className="w-full px-4 lg:px-10 py-20 text-center">
        <h1 className="font-display text-2xl text-foreground">Nur für den Besitzer</h1>
        <p className="text-[15px] font-semibold text-muted-foreground mt-2">Diese Anleitung sieht nur der Admin.</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 lg:px-10 py-8">
      <div className="mb-6">
        <h1 className="font-display text-4xl text-foreground text-gloss">Anleitung</h1>
        <p className="text-[15px] font-semibold text-muted-foreground mt-2 max-w-4xl leading-relaxed">
          Zum Nachschlagen: Schritt für Schritt, mit den genauen Stellen in der App. Damit du nicht
          jedes Mal fragen musst — und damit du weißt, was schon läuft und was nicht.
        </p>
        <Link
          to="/spickzettel"
          className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-full glass-btn glass-btn-accent text-[14px] font-bold text-gloss"
        >
          Zum Spickzettel
        </Link>
      </div>

      <div className="space-y-5">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="glass rounded-2xl border-2 border-border p-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </span>
                <h2 className="font-display text-2xl text-foreground">{s.title}</h2>
              </div>
              <p className="text-[15px] font-semibold text-muted-foreground mb-4">{s.intro}</p>

              {s.steps && (
                <ol className="space-y-3">
                  {s.steps.map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-[13px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="text-[15px] font-semibold text-foreground/90 leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              )}

              {s.items && (
                <ul className="space-y-2">
                  {s.items.map((item, i) => (
                    <li key={i} className="flex gap-3 text-[15px] font-semibold text-foreground/90 leading-relaxed">
                      <span className="text-primary font-bold flex-shrink-0">·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {s.to && (
                <Link
                  to={s.to}
                  className="inline-flex items-center gap-2 mt-5 px-5 py-2.5 rounded-full glass-btn glass-btn-accent text-[14px] font-bold text-gloss"
                >
                  {s.toLabel}
                </Link>
              )}
            </div>
          );
        })}

        <div className="glass rounded-2xl border-2 border-border p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <KeyRound className="w-5 h-5 text-primary" />
            </span>
            <h2 className="font-display text-2xl text-foreground">Wo du was findest</h2>
          </div>
          <ul className="space-y-2">
            {FIND_SPOTS.map((item, i) => (
              <li key={i} className="flex gap-3 text-[15px] font-semibold text-foreground/90 leading-relaxed">
                <span className="text-primary font-bold flex-shrink-0">·</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="glass rounded-2xl border-2 border-primary/40 p-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MessageSquare className="w-5 h-5 text-primary" />
            </span>
            <h2 className="font-display text-2xl text-foreground">Wenn du etwas anbauen willst</h2>
          </div>
          <p className="text-[15px] font-semibold text-muted-foreground leading-relaxed">
            Sag in einem Satz, was du willst — ich baue es ein. Für fremde Dienste brauche ich keine
            Zugangsdaten von dir: entweder gibt es eine offizielle Verbindung, oder du hinterlegst den
            Schlüssel selbst im Dashboard. Dann sage ich dir nur, welcher Name dorthin gehört und wo du
            den Wert herbekommst.
          </p>
        </div>
      </div>
    </div>
  );
}