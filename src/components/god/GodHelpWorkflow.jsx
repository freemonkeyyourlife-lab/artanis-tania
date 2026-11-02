import React from "react";
import { Link } from "react-router-dom";
import { Workflow, Github, ArrowRight } from "lucide-react";
import GodTrainAnleitung from "@/components/god/train/GodTrainAnleitung";
import GodDomainConnect from "@/components/god/GodDomainConnect";

// Zentrale Hilfs- und Workflow-Seite im Godmode. Sie führt den ganzen Weg:
// von der Medienaufnahme über das Archiv bis zum fertigen Trainingsset —
// und zeigt, wie ein GitHub-Projekt zur Web-App wird und die Wunsch-Domain
// live geht. Jeder Schritt verlinkt dorthin, wo er passiert.

const MEDIEN_WEG = [
  { label: "Quellen ins Archiv laden", path: "/archiv", note: "Bilder, Video, Audio, Text — alles landet (stored privately) und wird nach Charakter sortiert." },
  { label: "Trainingsset anlegen", path: "/trainingsset", note: "Pro Person ein Set, Bilder sammeln, zuordnen, auffüllen." },
  { label: "Charakter anlegen", path: "/charakter", note: "Figur bauen, Stimme verknüpfen, Erscheinung festhalten." },
  { label: "Stimmbank", path: "/stimmen", note: "Stimme anlegen, klonen, einstellen — steht dann im Chat bereit." },
];

const SITE_WEG = [
  { label: "Sites-Reiter in der Konsole", note: "GitHub-Repo laden, ZIP bauen, Ziel wählen." },
  { label: "Bei Hoster hochladen", note: "ZIP bei Netlify/Vercel/GitHub Pages/eigenem Webspace hochladen." },
  { label: "Domain verbinden", note: "Unten die Schritte pro Ziel — Wunsch-Domain live schalten." },
];

export default function GodHelpWorkflow() {
  return (
    <div className="flex flex-col gap-4 px-1 py-1">
      <div className="flex items-center gap-2 text-primary">
        <Workflow className="w-4 h-4" />
        <p className="text-[13px] font-bold uppercase tracking-wider">Zentrale Hilfe & Workflow</p>
      </div>

      <div>
        <h3 className="font-display text-[15px] text-foreground mb-2">Weg 1 · Medienaufnahme → fertiges Trainingsset</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
          {MEDIEN_WEG.map((s) => (
            <Link
              key={s.label}
              to={s.path}
              className="rounded-xl border border-border bg-elevated p-2.5 hover:border-primary/50 transition-colors"
            >
              <p className="text-[12px] font-bold text-foreground flex items-center gap-1">{s.label} <ArrowRight className="w-3 h-3 text-primary" /></p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{s.note}</p>
            </Link>
          ))}
        </div>
        <GodTrainAnleitung />
      </div>

      <div className="border-t-2 border-border pt-3">
        <h3 className="font-display text-[15px] text-foreground mb-2 flex items-center gap-1.5">
          <Github className="w-4 h-4 text-primary" /> Weg 2 · GitHub-Seiten bauen & Domain verbinden
        </h3>
        <ol className="space-y-1.5 mb-3">
          {SITE_WEG.map((s, i) => (
            <li key={i} className="flex items-start gap-2 text-[12px] text-foreground leading-snug">
              <span className="shrink-0 w-5 h-5 rounded-full bg-primary/15 text-primary font-bold flex items-center justify-center text-[10px]">{i + 1}</span>
              <span><span className="font-bold">{s.label}.</span> {s.note}</span>
            </li>
          ))}
        </ol>
        <p className="text-[11px] text-muted-foreground mb-2">
          Öffne die Konsole rechts → Reiter <span className="font-bold text-foreground">Sites</span>, um ein GitHub-Projekt zu verknüpfen. Nach dem Ablegen erscheinen dort die Domain-Schritte pro Ziel.
        </p>
        <GodDomainConnect />
      </div>
    </div>
  );
}