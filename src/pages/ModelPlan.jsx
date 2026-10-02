import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { PLAN_SECTIONS } from "@/lib/modelPlan";
import ModelPlanTable from "@/components/plan/ModelPlanTable";

// Der Modell-Plan zum Nachschlagen: welche Bild-Modelle es gibt, was uns fehlt,
// was wofür bekannt ist und wo man mit wenig Geld am weitesten kommt.
// Nur für den Besitzer.
export default function ModelPlan() {
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
        <p className="text-[15px] font-semibold text-muted-foreground mt-2">Den Modell-Plan sieht nur der Admin.</p>
      </div>
    );
  }

  return (
    <div className="w-full px-4 lg:px-10 py-8">
      <div className="mb-6">
        <h1 className="font-display text-4xl text-foreground text-gloss">Modell-Plan</h1>
        <p className="text-[15px] font-semibold text-muted-foreground mt-2 max-w-4xl leading-relaxed">
          Zum Nachschlagen: welche Bild-Modelle es gibt, was wir schon haben, was fehlt,
          was wofür bekannt ist — und wo du mit wenig Geld am weitesten kommst.
          Die Regel steht über allem: <span className="text-foreground">nichts unter 3D</span>.
        </p>
      </div>

      <div className="space-y-5">
        {PLAN_SECTIONS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.key} className="glass rounded-2xl border-2 border-border p-5 lg:p-6">
              <div className="flex items-center gap-3 mb-2">
                <span className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-5 h-5 text-primary" />
                </span>
                <h2 className="font-display text-xl lg:text-2xl text-foreground leading-tight">{s.title}</h2>
              </div>
              <p className="text-[15px] font-semibold text-muted-foreground mb-4">{s.intro}</p>

              {s.columns && s.rows && <ModelPlanTable columns={s.columns} rows={s.rows} />}

              {s.bullets && (
                <ul className="space-y-2">
                  {s.bullets.map((item, i) => (
                    <li key={i} className="flex gap-3 text-[15px] font-semibold text-foreground/90 leading-relaxed">
                      <span className="text-primary font-bold flex-shrink-0">·</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              )}

              {s.note && (
                <p className="mt-4 p-4 rounded-xl bg-primary/10 border-2 border-primary/30 text-[14px] font-semibold text-foreground/90 leading-relaxed">
                  {s.note}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}