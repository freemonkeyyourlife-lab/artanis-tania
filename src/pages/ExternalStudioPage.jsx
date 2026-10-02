import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import ExternalStudio from "@/components/studio/ExternalStudio";

// Eigene Seite, damit das Externe Studio direkt verlinkt werden kann.
export default function ExternalStudioPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-4">
      <Link
        to="/studio"
        className="inline-flex items-center gap-2 text-[13px] font-bold text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> Zurück zum Studio
      </Link>
      <ExternalStudio />
    </div>
  );
}