import React, { useState } from "react";
import { getStudioHelp } from "@/lib/studioHelp";
import StudioManualModal from "@/components/studio/StudioManualModal";
import { Info, ChevronDown, MousePointerClick, BookOpen } from "lucide-react";

// Pro Seite eine Anleitung: ein klappbarer Kasten oben, der erklärt was die
// Seite tut und was jeder Button bedeutet. Inhalt kommt aus studioHelp.js.

export default function StudioAnleitung({ pageKey }) {
  const [open, setOpen] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const help = getStudioHelp(pageKey);
  if (!help) return null;

  return (
    <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/5">
      <button onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
        title="Anleitung und Button-Erklärungen für diese Seite">
        <Info className="h-4 w-4 text-primary" />
        <span className="font-heading text-sm text-foreground">{help.title}</span>
        <span className="ml-1 hidden text-xs text-muted-foreground sm:inline">Anleitung & was die Buttons bedeuten</span>
        <button onClick={(e) => { e.stopPropagation(); setManualOpen(true); }} title="Gesamtes Handbuch ansehen und auf die Platte speichern"
          className="ml-auto inline-flex items-center gap-1 rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-semibold text-primary hover:bg-primary/25">
          <BookOpen className="h-3.5 w-3.5" /> Handbuch
        </button>
        <ChevronDown className={"ml-2 h-4 w-4 text-muted-foreground transition-transform " + (open ? "rotate-180" : "")} />
      </button>

      {open && (
        <div className="border-t border-primary/20 px-4 py-3">
          <p className="text-[13px] text-foreground">{help.intro}</p>

          {help.steps?.length > 0 && (
            <ol className="mt-3 space-y-1.5">
              {help.steps.map((s, i) => (
                <li key={i} className="flex gap-2 text-[13px] text-muted-foreground">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[11px] font-bold text-primary">{i + 1}</span>
                  <span className="text-foreground/90">{s}</span>
                </li>
              ))}
            </ol>
          )}

          {help.buttons?.length > 0 && (
            <div className="mt-4">
              <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-muted-foreground">
                <MousePointerClick className="h-3.5 w-3.5" /> Buttons erklärt
              </p>
              <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {help.buttons.map((b, i) => (
                  <div key={i} className="flex gap-2 rounded-xl border border-border bg-elevated px-3 py-1.5">
                    <span className="shrink-0 rounded-md bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">{b.label}</span>
                    <span className="text-[12px] text-muted-foreground">{b.meaning}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <StudioManualModal open={manualOpen} onClose={() => setManualOpen(false)} />
    </div>
  );
}