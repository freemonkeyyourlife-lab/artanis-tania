import React, { useState } from "react";
import { cn } from "@/lib/utils";
import ExternalOverview from "@/components/studio/ExternalOverview";
import MassGeneration from "@/components/studio/MassGeneration";
import ExternalPromptUpload from "@/components/studio/ExternalPromptUpload";

const SECTIONS = [
  { id: "overview", label: "Übersicht" },
  { id: "mass", label: "Massen-Erzeugung" },
  { id: "prompt", label: "Prompts & Upload" },
];

// Der zentrale Arbeitsplatz: erst sehen, was da ist, dann in Serie erzeugen,
// dann Prompts mitnehmen und Ergebnisse zurücklegen.
export default function ExternalStudio({ onChanged }) {
  const [section, setSection] = useState("overview");

  return (
    <div className="glass rounded-2xl border-2 border-border p-6">
      <div className="mb-5">
        <p className="font-display text-2xl text-foreground mb-1">Externes Studio</p>
        <p className="text-[15px] font-semibold text-muted-foreground max-w-3xl">
          Dein Arbeitsplatz für Bilder: Inhalte, Vorlagen und Modell-Einstellungen auf einen Blick, Charaktere in Serie
          erzeugen und fertige Ergebnisse zurücklegen.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={cn(
              "px-5 py-2.5 rounded-full text-[14px] font-bold transition-colors",
              section === s.id ? "glass-btn glass-btn-accent text-gloss" : "glass-btn text-muted-foreground"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      {section === "overview" && <ExternalOverview onGoTo={() => setSection("mass")} />}
      {section === "mass" && <MassGeneration onChanged={onChanged} />}
      {section === "prompt" && <ExternalPromptUpload onChanged={onChanged} />}
    </div>
  );
}