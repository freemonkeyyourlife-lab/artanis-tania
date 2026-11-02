import React from "react";

// Anleitung: wie das Training funktioniert — vom Sammeln bis zur Anbindung.
const STEPS = [
  { t: "Sammeln", d: "Bilder und Videos aus jeder Quelle hochladen — Archiv, Drive, Scraper oder externe Apps. Alles landet zuerst im Pool." },
  { t: "Sortieren", d: "Jedes Medium wird einer Person (Charakter) zugeordnet. Der Auto-Sortieren erkennt Namen im Dateinamen automatisch." },
  { t: "Vervielfältigen", d: "Hat ein Set zu wenig Bilder, erzeugt die Bildgenerierung aus dem ersten Bild neue Varianten derselben Person — bis das Ziel erreicht ist." },
  { t: "Archivieren", d: "Fertige Sets bleiben im Archiv und dürfen nicht gelöscht werden. Originale und generierte Bilder bleiben zusammen." },
  { t: "ZIP vorbereiten", d: "Pro Person wird ein ZIP-Paket geschnürt — alle Bilder nummeriert, bereit zum Upload auf den Trainingsserver." },
  { t: "Trainieren", d: "Das ZIP lädt auf dem externen GPU-Trainingsanschluss (LoRA). Hier wird kein Server bestellt, nur vorbereitet." },
  { t: "Anbinden", d: "Die trainierte Stimme und das Modell werden als Voice / ImageModel im Studio verknüpft und stehen im Chat bereit." },
];

export default function GodTrainAnleitung() {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12px] text-muted-foreground leading-relaxed">
        So funktioniert das Training — sieben Schritte, die dieses Werkzeug begleiten.
      </p>
      {STEPS.map((s, i) => (
        <div key={s.t} className="rounded-xl border border-border bg-elevated p-3">
          <p className="text-[13px] font-bold text-primary">{i + 1}. {s.t}</p>
          <p className="mt-1 text-[12px] text-foreground leading-relaxed">{s.d}</p>
        </div>
      ))}
      <div className="rounded-xl border-2 border-dashed border-primary/30 bg-background p-3">
        <p className="text-[12px] font-bold text-foreground">Hinweis</p>
        <p className="mt-1 text-[12px] text-muted-foreground leading-relaxed">
          Das Vervielfältigen ist keine LoRA-Trainierung — es ergänzt nur Bildmaterial. Für dauerhaft
          trainierte Charaktere ist ein eigener GPU-Trainingsanschluss nötig.
        </p>
      </div>
    </div>
  );
}