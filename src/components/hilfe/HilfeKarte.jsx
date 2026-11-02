import React from "react";
import { Link } from "react-router-dom";
import { Crown, MessageSquare, Boxes, BookOpen } from "lucide-react";

// Wo liegt was — die Karte der ganzen App in wenigen Blöcken. Jeder Eintrag
// ist ein Link, damit der Nutzer mit einem Klick genau dort landet.
const BLOECKE = [
  {
    icon: Crown,
    titel: "Werkstatt & Godmode",
    zeilen: [
      { path: "/owner", label: "Besitzer-Konsole — Quellen, Vervielfältigung, Sites, Video, Roadmap" },
      { path: "/studio", label: "Studio — Inhalte, Charaktere, Stimmen, Modelle, Storys" },
      { path: "/trainingsset", label: "Trainingssets — Bild-Sets pro Person, ZIP, auffüllen" },
      { path: "/archiv", label: "Archiv — alle Medien zentral, nach Charakter sortiert" },
    ],
  },
  {
    icon: MessageSquare,
    titel: "Chat & Stimme",
    zeilen: [
      { path: "/messages", label: "Nachrichten — Gespräche, Stimmung, automatisches Vorlesen" },
      { path: "/chatmodul", label: "Chat-Modul — eigenständiger Chat zum Einbetten" },
      { path: "/stimmen", label: "Stimmbank — Stimmen anlegen, klonen, einstellen" },
      { path: "/erzaehler", label: "Erzählerin — Begleiterin einrichten" },
      { path: "/vorleser", label: "Vorleser — Text vorlesen lassen" },
    ],
  },
  {
    icon: Boxes,
    titel: "Figuren & Inhalte",
    zeilen: [
      { path: "/charakter", label: "Charakter-Studio — Figuren bauen und mischen" },
      { path: "/ideen", label: "Ideen-Ordner — Ideen und Szenen sammeln" },
      { path: "/planung", label: "Content-Planer — Veröffentlichung planen" },
      { path: "/verkauf", label: "Verkaufs-Dashboard — Umsätze und Kunden" },
    ],
  },
  {
    icon: BookOpen,
    titel: "Wissen & Begleitung",
    zeilen: [
      { path: "/leitfaden", label: "Leitfaden — ausführliche Anleitungen" },
      { path: "/spickzettel", label: "Spickzettel — Kurzreferenz" },
      { path: "/logbuch", label: "Logbuch — Bauberichte und Fortschritt" },
      { path: "/recht", label: "Recht — rechtliche Texte und Regeln" },
    ],
  },
];

export default function HilfeKarte() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {BLOECKE.map((b) => {
        const Icon = b.icon;
        return (
          <div key={b.titel} className="rounded-[2rem] border-2 border-border bg-card p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-10 h-10 rounded-full bg-primary/15 flex items-center justify-center">
                <Icon className="w-5 h-5 text-primary" />
              </span>
              <h3 className="font-display text-lg text-foreground">{b.titel}</h3>
            </div>
            <ul className="space-y-1.5">
              {b.zeilen.map((z) => (
                <li key={z.path}>
                  <Link
                    to={z.path}
                    className="block rounded-xl px-3 py-2 text-[14px] font-semibold text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
                  >
                    {z.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}