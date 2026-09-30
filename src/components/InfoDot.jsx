import React, { useEffect, useState } from "react";
import { Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { getInfoMode, subscribeInfoMode } from "@/lib/infoMode";
import { getStructure, subscribeStructure, loadStructure } from "@/lib/onboarding";

// Der Info-Knopf. Er erscheint nur, wenn Erklärungen eingeschaltet sind,
// und zeigt auf Klick einen kurzen Klartext zu genau dieser Stelle.
export default function InfoDot({ topic, className, size = "md" }) {
  const [open, setOpen] = useState(false);
  const [personal, setPersonal] = useState(getInfoMode());
  const [structure, setStructure] = useState(getStructure());

  useEffect(() => subscribeInfoMode(setPersonal), []);
  useEffect(() => subscribeStructure(setStructure), []);
  useEffect(() => {
    loadStructure();
  }, []);

  const text = structure.infoTexts?.[topic];
  if (!structure.infoEnabled || !personal || !text) return null;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        title="Erklärung"
        className={cn(
          "rounded-full bg-primary/15 text-primary hover:bg-primary/30 transition-colors flex items-center justify-center flex-shrink-0",
          size === "sm" ? "w-5 h-5" : "w-7 h-7",
          className
        )}
      >
        <Info className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
      </button>

      {open && (
        <div className="fixed inset-0 z-[95] flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          <div
            className="relative glass-strong rounded-3xl border-2 border-border p-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <span className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                <Info className="w-4 h-4 text-primary" />
              </span>
              <p className="flex-1 text-[15px] font-semibold text-foreground leading-relaxed pt-1">{text}</p>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 rounded-full glass-btn flex items-center justify-center text-muted-foreground flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}