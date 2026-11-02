import React from "react";
import { CheckCircle2, XCircle } from "lucide-react";

// Anleitung: wie Trainingssets vorbereitet, Bilder ausgewählt und das Modell
// effizient trainiert werden — Schritt für Schritt, konkret und ohne Drumherum.
const STEPS = [
  {
    t: "1 · Trainingsset anlegen",
    d: "Lege pro Person ein Set an (Übersicht → „Sets anlegen“). Stelle das Ziel auf 12–30 Bilder. Ein eigenes Set pro Charakter hält das Training sauber.",
  },
  {
    t: "2 · Bilder sammeln",
    d: "Lade Bilder über den Pool hoch — aus dem Archiv, der Werkstatt oder den KI-Studio-Applets. Alles landet zuerst im Pool, unverbindlich.",
  },
  {
    t: "3 · Bilder auswählen",
    d: "Nur gute Bilder ins Set: Gesicht klar erkennbar, gut beleuchtet, scharf, eine Person pro Bild. Verschiedene Posen und Ausdrücke, kein Doppeltes.",
  },
  {
    t: "4 · Zuordnen",
    d: "Ordne jedes Bild einer Person zu — per Hand oder „Auto-Sortieren“, wenn der Dateiname den Personennamen enthält. Der Avatar ist das erste Bild.",
  },
  {
    t: "5 · Vervielfältigen",
    d: "Reichen die Bilder nicht, erzeugt „Vervielfältigen“ aus dem ersten Bild neue Varianten derselben Person — bis das Ziel erreicht ist.",
  },
  {
    t: "6 · ZIP vorbereiten",
    d: "Übersicht → „Alle ZIPs“ legt pro Person ein nummeriertes Archiv. Das ZIP lädst du später auf den externen Trainingsserver.",
  },
  {
    t: "7 · Modell trainieren",
    d: "Auf dem GPU-Trainingsansatz (LoRA): 12–30 Bilder, 1500–2500 Schritte, Lernrate 1e-4. Keine echten Personen ohne Einwilligung. Hier wird kein Server bestellt.",
  },
  {
    t: "8 · Anbinden",
    d: "Das trainierte Modell als ImageModel anlegen, die trainierte Stimme als Voice verknüpfen. Ab sofort stehen beide im Chat und in der Erzeugung bereit.",
  },
];

const GOOD = ["Gesicht klar sichtbar", "Gute Beleuchtung", "Scharf, kein Motion-Blur", "Verschiedene Posen & Ausdrücke", "Eine Person pro Bild"];
const BAD = ["Dunkel, unterbelichtet", "Verschwommen oder verrauscht", "Mehrere Personen im Bild", "Gesicht verdeckt", "Identisches Bild doppelt"];

export default function GodTrainAnleitung() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12px] text-muted-foreground leading-relaxed">
        So bereitest du Trainingssets vor, wählst Bilder und trainierst effizient.
      </p>

      {STEPS.map((s) => (
        <div key={s.t} className="rounded-xl border border-border bg-elevated p-3">
          <p className="text-[13px] font-bold text-primary">{s.t}</p>
          <p className="mt-1 text-[12px] text-foreground leading-relaxed">{s.d}</p>
        </div>
      ))}

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border-2 border-primary/30 bg-background p-3">
          <p className="text-[12px] font-bold text-primary mb-1">Gute Bilder</p>
          {GOOD.map((g) => (
            <p key={g} className="flex items-start gap-1.5 text-[11px] text-foreground"><CheckCircle2 className="w-3 h-3 text-primary shrink-0 mt-0.5" /> {g}</p>
          ))}
        </div>
        <div className="rounded-xl border-2 border-destructive/30 bg-background p-3">
          <p className="text-[12px] font-bold text-destructive mb-1">Lieber nicht</p>
          {BAD.map((g) => (
            <p key={g} className="flex items-start gap-1.5 text-[11px] text-foreground"><XCircle className="w-3 h-3 text-destructive shrink-0 mt-0.5" /> {g}</p>
          ))}
        </div>
      </div>

      <div className="rounded-xl border-2 border-dashed border-primary/30 bg-background p-3">
        <p className="text-[12px] font-bold text-foreground">Faustregel</p>
        <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed">
          Lieber 20 sorgfältig ausgewählte Bilder als 80 mittelmäßige. Qualität schlägt Menge —
          das Modell lernt das Gesicht klarer und verallgemeinert besser.
        </p>
      </div>
    </div>
  );
}