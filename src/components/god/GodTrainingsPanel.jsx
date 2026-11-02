import React, { useState } from "react";
import { cn } from "@/lib/utils";
import GodTrainOverview from "@/components/god/train/GodTrainOverview";
import GodTrainSources from "@/components/god/train/GodTrainSources";
import GodTrainMultiply from "@/components/god/train/GodTrainMultiply";
import GodTrainAnbindung from "@/components/god/train/GodTrainAnbindung";
import GodTrainAnleitung from "@/components/god/train/GodTrainAnleitung";
import GodTrainArchiv from "@/components/god/train/GodTrainArchiv";

const TABS = [
  { key: "ueber", label: "Übersicht" },
  { key: "archiv", label: "Archiv" },
  { key: "quellen", label: "Quellen" },
  { key: "mehr", label: "Vervielfältigen" },
  { key: "anbindung", label: "Anbindung" },
  { key: "anleitung", label: "Anleitung" },
];

// Werkstatt im Godmode: die ganze Trainingsdaten-Steuerung in einem Reiter —
// Verzeichnis, Quellen-Suche, Vervielfältigung, ZIP, Anbindung, Anleitung.
export default function GodTrainingsPanel() {
  const [tab, setTab] = useState("ueber");
  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-wrap gap-1 px-3 py-2 border-b-2 border-border">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn("px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors", tab === t.key ? "glass-btn glass-btn-accent text-gloss" : "glass-btn text-foreground")}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {tab === "ueber" && <GodTrainOverview />}
        {tab === "archiv" && <GodTrainArchiv />}
        {tab === "quellen" && <GodTrainSources />}
        {tab === "mehr" && <GodTrainMultiply />}
        {tab === "anbindung" && <GodTrainAnbindung />}
        {tab === "anleitung" && <GodTrainAnleitung />}
      </div>
    </div>
  );
}