import React, { useEffect, useState } from "react";
import { Loader2, RefreshCw, Check, ImageOff } from "lucide-react";
import { reloadImages } from "@/lib/assistant";

// Schritt 2: Bilder nachladen — aus den Quellen, die am Charakter hängen.
export default function AssistantImageStep({ creators, onReloaded }) {
  const [state, setState] = useState({ busy: true, added: 0, without: [] });

  const run = async () => {
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
    run();
  }, []);

  return (
    <div>
      <p className="font-display text-xl text-foreground mb-1">Bilder nachladen</p>
      <p className="text-[15px] font-semibold text-muted-foreground mb-4 max-w-2xl">
        Was an den Charakteren als Bild hängt, wird erneut aus der Quelle geholt und in ihre Galerie gelegt.
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
                Für diese gibt es keine Quelle zum Nachladen. Leg ihre Bilder im Reiter „Externes Studio“ ab — Prompt
                kopieren, draußen erzeugen, hier hochladen.
              </p>
              <div className="flex flex-wrap gap-1.5">
                {state.without.slice(0, 24).map((c) => (
                  <span key={c.id} className="px-3 py-1.5 rounded-full bg-elevated border border-border text-[13px] font-bold text-foreground">
                    {c.stageName}
                  </span>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <button
        onClick={run}
        disabled={state.busy}
        className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[14px] font-bold text-foreground disabled:opacity-50"
      >
        <RefreshCw className="w-4 h-4" /> Nochmal laden
      </button>
    </div>
  );
}