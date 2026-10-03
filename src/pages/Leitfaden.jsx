import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Map as MapIcon, Compass, ArrowRight } from "lucide-react";
import { RECIPES, MAP, RULE } from "@/lib/leitfaden";

// Der Leitfaden: „Wenn ich das will, klicke ich da und da." Ein Weg nach dem
// anderen, jeder mit einem Knopf, der direkt hinspringt. Nur für den Besitzer.

export default function Leitfaden() {
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
        <p className="text-[15px] font-semibold text-muted-foreground mt-2">Den Leitfaden sieht nur der Admin.</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 lg:px-10 py-8">
      <div className="mb-6">
        <h1 className="font-display text-4xl text-foreground text-gloss flex items-center gap-3">
          <Compass className="w-8 h-8 text-primary" /> Leitfaden
        </h1>
        <p className="text-[15px] font-semibold text-muted-foreground mt-2 max-w-4xl leading-relaxed">
          Wenn du etwas willst, steht hier, wo du klickst. Ein Weg nach dem anderen — vom Wunsch bis zum Knopf,
          der dich direkt hinbringt.
        </p>
      </div>

      <div className="glass rounded-2xl border-2 border-border p-6 mb-5">
        <div className="flex items-center gap-3 mb-4">
          <span className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <MapIcon className="w-5 h-5 text-primary" />
          </span>
          <h2 className="font-display text-2xl text-foreground">Die Landkarte</h2>
        </div>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
          {MAP.map((m) => (
            <div key={m.area} className="flex gap-3">
              <span className="text-[14px] font-bold text-primary w-28 flex-shrink-0">{m.area}</span>
              <span className="text-[14px] font-semibold text-foreground/90 leading-relaxed">{m.what}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {RECIPES.map((r) => {
          const Icon = r.icon;
          return (
            <div key={r.want} className="glass rounded-2xl border-2 border-border p-6">
              <div className="flex items-start gap-3 mb-4">
                <span className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </span>
                <h2 className="font-display text-xl text-foreground leading-snug pt-1.5">{r.want}</h2>
              </div>
              <ol className="space-y-2">
                {r.steps.map((s, i) => (
                  <li key={i} className="flex gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary text-primary-foreground text-[13px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-[15px] font-semibold text-foreground/90 leading-relaxed">{s}</span>
                  </li>
                ))}
              </ol>
              <Link
                to={r.to}
                className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-full glass-btn glass-btn-accent text-[14px] font-bold text-gloss"
              >
                {r.toLabel} <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          );
        })}

        <div className="glass rounded-2xl border-2 border-primary/40 p-6">
          <div className="flex items-start gap-3">
            <span className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
              <RULE.icon className="w-5 h-5 text-primary" />
            </span>
            <p className="text-[15px] font-semibold text-foreground/90 leading-relaxed pt-2">{RULE.text}</p>
          </div>
        </div>
      </div>
    </div>
  );
}