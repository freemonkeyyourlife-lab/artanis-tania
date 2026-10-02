import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FlaskConical, Loader2, ArrowRight, EyeOff } from "lucide-react";
import { loadLayout } from "@/lib/siteLayout";
import { structureOf } from "@/lib/siteStructure";
import { moduleFor } from "@/lib/modules";
import { cn } from "@/lib/utils";

// Die Testsandbox: die Leiste, wie sie jetzt steht — jeder Knopf lässt sich
// durchklicken, ohne dass etwas gespeichert oder verändert wird.
export default function Sandbox() {
  const [areas, setAreas] = useState(null);

  useEffect(() => {
    loadLayout()
      .then((row) => setAreas(structureOf(row).areas))
      .catch(() => setAreas([]));
  }, []);

  const total = (areas || []).reduce((n, a) => n + a.items.length, 0);
  const off = (areas || []).reduce((n, a) => n + a.items.filter((i) => i.hidden).length, 0);

  return (
    <div className="w-full px-4 lg:px-10 py-8">
      <div className="mb-6">
        <h1 className="font-display text-4xl text-foreground text-gloss flex items-center gap-3">
          <FlaskConical className="w-8 h-8 text-primary" /> Testsandbox
        </h1>
        <p className="text-[15px] font-semibold text-muted-foreground mt-2 max-w-3xl leading-relaxed">
          Hier probierst du die Menüführung aus, bevor sie für alle gilt. Jeder Knopf führt auf die echte Seite —
          nichts wird dabei gespeichert oder verändert.
        </p>
      </div>

      {areas === null ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          <div className="glass rounded-2xl border border-border p-5 mb-5">
            <p className="text-[15px] font-bold text-foreground">
              {total} Knöpfe in {areas.length} Bereichen
              {off > 0 ? ` — davon ${off} abgeschaltet` : " — alle eingeschaltet"}
            </p>
            <p className="text-[13px] font-semibold text-muted-foreground mt-1">
              Abschalten und wieder anschalten tust du in der Besitzer-Konsole unter „Struktur".
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {areas.map((area) => (
              <div key={area.id} className="glass rounded-2xl border-2 border-border p-4">
                <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
                  {area.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {area.items.length === 0 && (
                    <p className="text-[13px] font-semibold text-muted-foreground">Leer.</p>
                  )}
                  {area.items.map((item) => (
                    <Link
                      key={item.id}
                      to={item.path}
                      title={moduleFor(item.path)?.description || item.path}
                      className={cn(
                        "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[13px] font-bold transition-colors",
                        item.hidden
                          ? "bg-elevated text-muted-foreground line-through opacity-60"
                          : "glass-btn text-foreground"
                      )}
                    >
                      {item.label || item.path}
                      {item.hidden ? <EyeOff className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="glass rounded-2xl border border-border p-5 mt-5">
            <p className="text-[15px] font-bold text-foreground mb-1">Auch die andere Sicht testen</p>
            <p className="text-[13px] font-semibold text-muted-foreground mb-3">
              Willst du sehen, wie die Leiste für einen normalen Nutzer aussieht?
            </p>
            <Link
              to="/vorschau"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn glass-btn-accent text-[14px] font-bold text-gloss"
            >
              Vorschau als Nutzer öffnen
            </Link>
          </div>
        </>
      )}
    </div>
  );
}