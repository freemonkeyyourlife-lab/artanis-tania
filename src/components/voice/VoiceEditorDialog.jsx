import React, { useState } from "react";
import { SlidersHorizontal } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import VoiceByCharacter from "@/components/studio/VoiceByCharacter";
import { cn } from "@/lib/utils";

// Der Stimmen-Editor, von überall erreichbar: im Call, im Chat und im Studio.
// Er zeigt dieselbe Ansicht wie die Stimmen-Seite — pro Charakter die Stimme
// und darunter die Regler.
export default function VoiceEditorDialog({ className, label = "Stimmen", title = "Stimmen-Editor" }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={title}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 h-9 rounded-full text-xs font-semibold bg-elevated text-muted-foreground hover:text-foreground transition-colors",
          className
        )}
      >
        <SlidersHorizontal className="w-4 h-4" />
        {label && <span className="hidden sm:inline">{label}</span>}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="font-display text-lg">Stimmen-Editor</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Jedem Charakter seine Stimme geben und Tonlage, Tempo und Intensität direkt darunter einstellen — gilt sofort im Chat und in der Sitzung.
          </DialogDescription>
          <VoiceByCharacter />
        </DialogContent>
      </Dialog>
    </>
  );
}