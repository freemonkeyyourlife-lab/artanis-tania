import React, { useEffect, useState } from "react";
import { LayoutGrid, Loader2, Copy, RotateCcw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import FigureAxisRow from "@/components/studio/FigureAxisRow";
import { loadAxes, composeFigure, GENDERS } from "@/lib/figureRaster";

// Das Raster: die Figur aus Achsen zusammensetzen statt sie in einem Satz zu
// beschreiben. Was hier herauskommt, ist reiner Text — der läuft bei jeder Maschine.
export default function FigureRaster() {
  const { toast } = useToast();
  const [gender, setGender] = useState("FRAU");
  const [axes, setAxes] = useState(null);
  const [picked, setPicked] = useState({});

  useEffect(() => {
    setAxes(null);
    setPicked({});
    loadAxes(gender).then(setAxes);
  }, [gender]);

  const { prompt, parts } = composeFigure(axes || [], picked, gender);

  const copy = () => {
    navigator.clipboard.writeText(prompt);
    toast({ title: "Prompt kopiert" });
  };

  const replaceAxis = (rec) => setAxes((list) => list.map((a) => (a.id === rec.id ? rec : a)));

  return (
    <div className="glass rounded-2xl border border-border p-5">
      <div className="flex items-center gap-2 mb-1">
        <LayoutGrid className="w-5 h-5 text-primary" />
        <h2 className="text-[17px] font-bold text-foreground">Das Raster</h2>
      </div>
      <p className="text-[13px] font-semibold text-muted-foreground mb-4 max-w-3xl leading-relaxed">
        Die Figur in Achsen zerlegt statt in einem Satz: dunkel statt hell, zierlich statt üppig, anschmiegsam statt
        kalt. Du wählst je Achse ein Wort — oder sagst mit eigenen Worten, was du damit meinst. Beides geht in den
        Prompt ein.
      </p>

      <div className="flex items-center gap-2 mb-4">
        {GENDERS.map((g) => (
          <button
            key={g.key}
            onClick={() => setGender(g.key)}
            className={
              gender === g.key
                ? "px-4 py-1.5 rounded-full glass-btn glass-btn-accent text-[13px] font-bold"
                : "px-4 py-1.5 rounded-full glass-btn text-[13px] font-bold text-foreground"
            }
          >
            {g.label}
          </button>
        ))}
      </div>

      {!axes ? (
        <div className="flex items-center gap-2 text-muted-foreground py-6">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-[13px] font-semibold">Achsen werden geladen…</span>
        </div>
      ) : (
        <div>
          {axes.map((a) => (
            <FigureAxisRow
              key={a.id}
              axis={a}
              picked={picked[a.id]}
              onPick={(label) => setPicked((p) => ({ ...p, [a.id]: label }))}
              onSaved={replaceAxis}
            />
          ))}
        </div>
      )}

      {parts.length > 0 && (
        <div className="mt-5">
          <div className="rounded-xl bg-background border border-border p-4">
            <div className="flex items-center justify-between gap-3 mb-2">
              <span className="text-[13px] font-bold text-primary">Der fertige Prompt</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPicked({})}
                  className="flex items-center gap-1.5 text-[12px] font-bold text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Leeren
                </button>
                <button
                  onClick={copy}
                  className="flex items-center gap-1.5 text-[12px] font-bold text-muted-foreground hover:text-foreground"
                >
                  <Copy className="w-3.5 h-3.5" /> Kopieren
                </button>
              </div>
            </div>
            <p className="text-[14px] font-semibold text-foreground leading-relaxed">{prompt}</p>
          </div>

          <div className="mt-3 rounded-xl bg-background border border-border p-4">
            <span className="block text-[12px] font-bold text-muted-foreground mb-2">Woher was kommt</span>
            <div className="space-y-1.5">
              {parts.map((p) => (
                <div key={p.axis} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3">
                  <span className="text-[12px] font-bold text-foreground sm:w-28 flex-shrink-0">{p.axis}</span>
                  <span className="text-[12px] font-semibold text-muted-foreground">
                    <span className="text-primary">{p.option.label}</span> → {p.option.text}
                    {p.option.note ? ` · deine Worte: ${p.option.note}` : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}