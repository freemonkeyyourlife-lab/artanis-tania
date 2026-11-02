import React from "react";
import { ExternalLink, Sparkles, Film, Images } from "lucide-react";

// Die externen KI-Studio-Apps direkt im Godmode eingebettet — Bild- und
// Video-Erzeugung laufen nahtlos im Dashboard, ohne die Plattform zu verlassen.
const APPS = [
  { id: "17268e3a-cbdd-400a-9b8c-7fe89b54310a", label: "Bild-Erzeugung", icon: Images, hint: "Porträt- und Serienbilder aus Referenzen erzeugen." },
  { id: "f17472b0-73dc-438b-aa4a-865bed753c3d", label: "Bild-Serie", icon: Sparkles, hint: "Mehrere Varianten in einem Durchlauf." },
  { id: "a162a948-d5c8-47e2-95e4-a77a7c18eedd", label: "Video-Erzeugung", icon: Film, hint: "Kurze Videosequenzen aus Prompt oder Bild." },
];
const WERKSTATT = "https://artanis-werkstatt-david.david-springer4ncnda.chatgpt.site/";

export default function GodTrainAnbindung() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[12px] text-muted-foreground leading-relaxed">
        Die KI-Studio-Applets sind direkt eingebettet — melde dich einmal im Applet mit deinem
        Google-Konto an, danach läuft Bild- und Video-Erzeugung ohne Tabwechsel im Dashboard.
      </p>

      {APPS.map((a) => {
        const Icon = a.icon;
        return (
          <div key={a.id} className="rounded-2xl border border-border bg-elevated p-3">
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-2 text-[13px] font-bold text-foreground">
                <Icon className="w-4 h-4 text-primary" /> {a.label}
              </span>
              <a
                href={`https://ai.studio/apps/${a.id}?fullscreenApplet=true`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-muted-foreground hover:text-primary"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Im Tab öffnen
              </a>
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">{a.hint}</p>
            <iframe
              src={`https://ai.studio/apps/${a.id}?fullscreenApplet=true`}
              title={a.label}
              className="mt-2 w-full h-[520px] rounded-xl border border-border bg-background"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            />
          </div>
        );
      })}

      <a
        href={WERKSTATT}
        target="_blank"
        rel="noreferrer"
        className="rounded-2xl border border-border bg-elevated p-3 flex items-center justify-between gap-2"
      >
        <div>
          <p className="text-[13px] font-bold text-foreground">Werkstatt-Verzeichnis</p>
          <p className="text-[11px] text-muted-foreground">Quellen & DCIM-Index, separat öffnen.</p>
        </div>
        <ExternalLink className="w-4 h-4 text-muted-foreground" />
      </a>
    </div>
  );
}