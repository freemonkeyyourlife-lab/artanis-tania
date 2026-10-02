import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, RefreshCw, Check, ImageOff, Wand2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { reloadImages } from "@/lib/assistant";
import { fillMissingImages } from "@/lib/creatorImages";
import { subscribeImport } from "@/lib/importRunner";

// Schritt 2: Bilder nachladen — erst aus den Quellen, die am Charakter hängen.
// Wo die Quelle blockt, werden die Bilder aus der eigenen Beschreibung erzeugt.
export default function AssistantImageStep({ creators, onReloaded }) {
  const { toast } = useToast();
  const [state, setState] = useState({ busy: true, added: 0, without: [] });
  const [run, setRun] = useState(null);

  useEffect(() => subscribeImport(setRun), []);

  const reload = async () => {
    setState((s) => ({ ...s, busy: true }));
    try {
      const res = await reloadImages(creators);
      setState({ busy: false, added: res.added, without: res.without });
      onReloaded?.();
    } catch (e) {
      console.error(e);
      setState({ busy: false, added: 0, without: [] });
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const generate = async () => {
    try {
      const page = await base44.entities.Dock.list("-created_date", 500);
      const docks = page.items || page || [];
      await fillMissingImages(state.without, docks);
      await reload();
      onReloaded?.();
    } catch (e) {
      console.error(e);
      toast({ title: "Hat nicht geklappt", description: "Versuch es noch einmal.", variant: "destructive" });
    }
  };

  const running = run?.running;

  return (
    <div>
      <p className="font-display text-xl text-foreground mb-1">Bilder nachladen</p>
      <p className="text-[15px] font-semibold text-muted-foreground mb-4 max-w-2xl">
        Was an den Charakteren als Bild hängt, wird erneut aus der Quelle geholt und in ihre Galerie gelegt. Bei
        importierten Charakteren blockt die fremde Seite den Abruf — für sie werden die Bilder aus ihrer eigenen
        Beschreibung erzeugt.
      </p>

      {state.busy ? (
        <p className="inline-flex items-center gap-2 text-[15px] font-bold text-muted-foreground py-8">
          <Loader2 className="w-4 h-4 animate-spin" /> Wird geladen …
        </p>
      ) : (
        <>
          <p className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-emerald-600/15 text-emerald-400 text-[14px] font-bold mb-4">
            <Check className="w-4 h-4" />
            {state.added > 0 ? `${state.added} Bilder nachgetragen` : "Alles war schon da"}
          </p>

          {state.without.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-4">
              <p className="inline-flex items-center gap-2 text-[14px] font-bold text-foreground mb-2">
                <ImageOff className="w-4 h-4 text-primary" /> {state.without.length} Charaktere ohne Bild
              </p>
              <p className="text-[13px] font-semibold text-muted-foreground mb-3">
                Ihre Quelle lässt sich nicht abrufen. Ein Klick erzeugt für jeden ein Bild aus seiner eigenen
                Beschreibung und legt es direkt am richtigen Profil ab — Hauptbild, Banner und Galerie.
              </p>

              <button
                onClick={generate}
                disabled={running}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass-btn glass-btn-accent text-[15px] font-bold text-gloss disabled:opacity-50"
              >
                {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                {running ? "Läuft …" : `Für ${state.without.length} Charaktere Bilder erzeugen`}
              </button>

              {running && (
                <p className="text-[13px] font-bold text-muted-foreground mt-3">
                  {run.done} / {run.total} — läuft im Hintergrund weiter, auch wenn du den Bereich wechselst.
                </p>
              )}

              <div className="flex flex-wrap gap-1.5 mt-4">
                {state.without.slice(0, 24).map((c) => (
                  <span
                    key={c.id}
                    className="px-3 py-1.5 rounded-full bg-elevated border border-border text-[13px] font-bold text-foreground"
                  >
                    {c.stageName}
                  </span>
                ))}
                {state.without.length > 24 && (
                  <span className="px-3 py-1.5 rounded-full text-[13px] font-bold text-muted-foreground">
                    +{state.without.length - 24} weitere
                  </span>
                )}
              </div>
            </div>
          )}
        </>
      )}

      <button
        onClick={reload}
        disabled={state.busy || running}
        className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[14px] font-bold text-foreground disabled:opacity-50"
      >
        <RefreshCw className="w-4 h-4" /> Nochmal laden
      </button>
    </div>
  );
}