import React, { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { getInfoMode, setInfoMode, subscribeInfoMode } from "@/lib/infoMode";
import { getStructure, subscribeStructure, loadStructure } from "@/lib/onboarding";

// Der Schalter für die Erklärungen — jederzeit an- und ausschaltbar.
export default function InfoModeToggle({ className }) {
  const [on, setOn] = useState(getInfoMode());
  const [structure, setStructure] = useState(getStructure());

  useEffect(() => subscribeInfoMode(setOn), []);
  useEffect(() => subscribeStructure(setStructure), []);
  useEffect(() => {
    loadStructure();
  }, []);

  if (!structure.infoEnabled) return null;

  return (
    <button
      type="button"
      onClick={() => setInfoMode(!on)}
      title={on ? "Erklärungen ausschalten" : "Erklärungen einschalten"}
      className={cn(
        "w-9 h-9 rounded-full glass-btn flex items-center justify-center transition-colors",
        on ? "text-primary" : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      <Info className="w-4 h-4" />
    </button>
  );
}