import React from "react";
import { Link } from "react-router-dom";
import { Sparkles, Blocks } from "lucide-react";
import PromptGenerator from "@/components/studio/PromptGenerator";

// Der Prompt-Generator als eigene Seite: Idee sprechen oder tippen, fertigen
// Prompt fürs externe Studio mitnehmen — in der Sprache des gewählten Modells.
export default function PromptStudio() {
  return (
    <div className="w-full px-4 lg:px-10 py-8">
      <div className="mb-6">
        <h1 className="font-display text-4xl text-foreground text-gloss flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-primary" /> Prompt-Generator
        </h1>
        <p className="text-[15px] font-semibold text-muted-foreground mt-2 max-w-3xl leading-relaxed">
          Sprich deine Idee oder tippe sie — daraus wird ein fertiger Prompt fürs externe Studio, mit Negativ-Prompt
          und LoRA-Zusatz. Alles kannst du vor dem Kopieren noch bearbeiten.
        </p>
      </div>

      <PromptGenerator />

      <div className="glass rounded-2xl border border-border p-5 mt-5">
        <p className="text-[15px] font-bold text-foreground mb-1">Mehrere Charaktere auf einmal</p>
        <p className="text-[13px] font-semibold text-muted-foreground mb-3">
          Für ganze Listen von Charakteren gibt es das Externe Studio im Studio-Bereich.
        </p>
        <Link
          to="/studio"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[14px] font-bold text-foreground"
        >
          <Blocks className="w-4 h-4" /> Zum Studio
        </Link>
      </div>
    </div>
  );
}