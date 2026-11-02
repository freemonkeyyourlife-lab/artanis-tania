import React from "react";
import { HelpCircle } from "lucide-react";
import HilfeKarte from "@/components/hilfe/HilfeKarte";
import WunschWorkflow from "@/components/hilfe/WunschWorkflow";

// Eine Seite, zwei Dinge: wo liegt was, und was willst du bauen — beides am
// selben Ort. Der Wunsch-Workflow darunter nimmt die Eingaben und speichert
// den fertigen Plan ins Logbuch.
export default function Hilfe() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <span className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
          <HelpCircle className="w-6 h-6 text-primary" />
        </span>
        <div>
          <h1 className="font-display text-3xl text-foreground">Hilfe & Wegweiser</h1>
          <p className="text-[15px] font-semibold text-muted-foreground">
            Wo liegt was — und was willst du bauen? Alles auf einer Seite.
          </p>
        </div>
      </div>

      <h2 className="font-display text-xl text-foreground mb-3">Wo finde ich was?</h2>
      <HilfeKarte />

      <h2 className="font-display text-xl text-foreground mt-8 mb-3">Was willst du bauen oder erleben?</h2>
      <WunschWorkflow />
    </div>
  );
}