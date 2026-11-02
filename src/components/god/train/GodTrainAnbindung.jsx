import React, { useState } from "react";
import { ExternalLink, Plug } from "lucide-react";

// Anbindung: die externen Werkzeuge als einbettbare Applets — genauso wie sie
// sind — plus die Werkstatt als Quelle.
const APPS = [
  { id: "17268e3a-cbdd-400a-9b8c-7fe89b54310a", label: "Werkzeug 1" },
  { id: "f17472b0-73dc-438b-aa4a-865bed753c3d", label: "Werkzeug 2" },
  { id: "a162a948-d5c8-47e2-95e4-a77a7c18eedd", label: "Werkzeug 3" },
];
const WERKSTATT = "https://artanis-werkstatt-david.david-springer4ncnda.chatgpt.site/";

export default function GodTrainAnbindung() {
  const [open, setOpen] = useState(null);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12px] text-muted-foreground leading-relaxed">
        Externe Werkzeuge aus Google AI Studio — eingebettet wie sie sind. Ein Klick öffnet das Applet
        im Panel, der Link öffnet es im eigenen Tab.
      </p>
      {APPS.map((a) => (
        <div key={a.id} className="rounded-xl border border-border bg-elevated p-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[13px] font-bold text-foreground inline-flex items-center gap-1.5"><Plug className="w-3.5 h-3.5 text-primary" /> {a.label}</span>
            <a href={`https://ai.studio/apps/${a.id}?fullscreenApplet=true`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-primary">
              <ExternalLink className="w-3.5 h-3.5" /> Öffnen
            </a>
          </div>
          <button onClick={() => setOpen(open === a.id ? null : a.id)} className="mt-2 w-full glass-btn rounded-full px-3 py-1.5 text-[12px] font-bold text-foreground">
            {open === a.id ? "Applet schließen" : "Applet einbetten"}
          </button>
          {open === a.id && (
            <iframe
              src={`https://ai.studio/apps/${a.id}?fullscreenApplet=true`}
              title={a.label}
              className="mt-2 w-full h-[420px] rounded-xl border border-border bg-background"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          )}
        </div>
      ))}
      <a href={WERKSTATT} target="_blank" rel="noreferrer" className="rounded-xl border border-border bg-elevated p-3 flex items-center justify-between gap-2">
        <span className="text-[13px] font-bold text-foreground">Werkstatt-Verzeichnis</span>
        <ExternalLink className="w-4 h-4 text-muted-foreground" />
      </a>
    </div>
  );
}