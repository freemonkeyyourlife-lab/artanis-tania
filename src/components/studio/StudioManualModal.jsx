import React, { useState } from "react";
import { STUDIO_HELP, downloadStudioManual } from "@/lib/studioHelp";
import { Download, X, BookOpen } from "lucide-react";

// Vorschau des gesamten Studio-Handbuchs in einem Fenster. Oben gibt's den
// „Auf Platte speichern"-Knopf, der die HTML-Datei herunterlädt.

export default function StudioManualModal({ open, onClose }) {
  if (!open) return null;
  const pages = Object.entries(STUDIO_HELP);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="flex h-[82vh] w-full max-w-2xl flex-col rounded-3xl border border-border bg-card" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 border-b border-border p-4">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg text-foreground">Studio-Handbuch — Vorschau</h2>
          <button onClick={onClose} className="ml-auto rounded-full bg-elevated p-1.5 text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>

        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          <p className="text-xs text-muted-foreground">Vorschau aller Anleitungen und Button-Erklärungen.</p>
          <button onClick={downloadStudioManual} title="HTML-Handbuch auf die Festplatte speichern"
            className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90">
            <Download className="h-3.5 w-3.5" /> Auf Platte speichern
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
          {pages.map(([key, h]) => (
            <section key={key} className="border-t border-border py-4 first:border-t-0">
              <h3 className="font-display text-base text-foreground">{h.title}</h3>
              <p className="mt-1 text-[13px] text-muted-foreground">{h.intro}</p>

              {h.steps?.length > 0 && (
                <ol className="mt-2 space-y-1">
                  {h.steps.map((s, i) => (
                    <li key={i} className="flex gap-2 text-[13px] text-foreground/90">
                      <span className="font-semibold text-primary">{i + 1}.</span> {s}
                    </li>
                  ))}
                </ol>
              )}

              {h.buttons?.length > 0 && (
                <div className="mt-3 grid gap-1.5 sm:grid-cols-2">
                  {h.buttons.map((b, i) => (
                    <div key={i} className="flex gap-2 rounded-lg border border-border bg-elevated px-2.5 py-1.5">
                      <span className="shrink-0 rounded-md bg-primary/15 px-2 py-0.5 text-[11px] font-semibold text-primary">{b.label}</span>
                      <span className="text-[12px] text-muted-foreground">{b.meaning}</span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}