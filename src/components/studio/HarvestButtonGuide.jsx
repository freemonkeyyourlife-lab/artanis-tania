import React, { useState } from "react";
import { HelpCircle, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Damit nichts geraten werden muss: hier steht schwarz auf weiß, was jeder Knopf tut.
const ENTRIES = [
  {
    name: "Seite durchsuchen",
    what: "Liest die eingetragene Adresse und sammelt alles ein, was hineinpasst: Modelle, Charaktere, Bilder, Videos, Audio und Links.",
  },
  {
    name: "Nur diese Seite / Mit Unterseiten",
    what: "Schaltet um, ob auch verlinkte Unterseiten derselben Seite gelesen werden. „Mit Unterseiten“ findet mehr, dauert aber länger.",
  },
  {
    name: "Häkchen links an jeder Zeile",
    what: "Bestimmt, ob genau dieses Fundstück übernommen wird. Ohne Häkchen bleibt es liegen und wird nicht gespeichert.",
  },
  {
    name: "Alle / Keine",
    what: "Setzt die Häkchen einer ganzen Gruppe auf einmal — oder nimmt sie alle wieder weg.",
  },
  {
    name: "Art (Modell, Bild, Link …)",
    what: "Bestimmt, wohin ein Fund wandert. Umstellen ändert das Ziel sofort — aus einem Bild wird so zum Beispiel ein Link.",
  },
  {
    name: "Name, Adresse, Notiz & Co.",
    what: "Alle Felder sind frei änderbar. Gespeichert wird genau das, was hier steht — nicht das, was gefunden wurde.",
  },
  {
    name: "Modell-Art",
    what: "Nur bei Modellen: ob der Link ein Bild-, Text-, Video- oder Audio-Modell beschreibt.",
  },
  {
    name: "Ziel-Charakter",
    what: "Bilder, Videos und Audio landen bei diesem Charakter in den Inhalten. Ohne Auswahl bleiben Medien liegen.",
  },
  {
    name: "Übernehmen",
    what: "Schreibt ausschließlich die angehakten Fundstücke an ihren Platz. Was schon vorhanden ist, bleibt unberührt.",
  },
];

export default function HarvestButtonGuide() {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 mb-5">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-2 text-[15px] font-bold text-foreground"
      >
        <HelpCircle className="w-4 h-4 text-primary" />
        Was macht welcher Knopf?
        <ChevronDown className={cn("w-4 h-4 transition-transform", !open && "-rotate-90")} />
      </button>

      {open && (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5">
          {ENTRIES.map((e) => (
            <div key={e.name} className="flex gap-2.5">
              <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
              <p className="text-[13px] font-semibold text-muted-foreground leading-relaxed">
                <span className="font-bold text-foreground">{e.name}</span> — {e.what}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}