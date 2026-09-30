import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import WishPanel from "@/components/wish/WishPanel";

// Der Knopf, mit dem jeder frei heraus sagen kann, was er will —
// und dafür fertige Angebote bekommt.
export default function WishButton({ className }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Sag was du willst — ich mach dir Angebote daraus"
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-full glass-btn glass-btn-accent text-[13px] font-bold text-gloss whitespace-nowrap",
          className
        )}
      >
        <Sparkles className="w-4 h-4" />
        <span className="hidden md:inline">Sag was du willst</span>
      </button>
      {/* Der Dialog liegt außerhalb der Kopfzeile — sonst bleibt er in deren
          Ebene gefangen und ist nicht zu sehen. */}
      {open && createPortal(<WishPanel onClose={() => setOpen(false)} />, document.body)}
    </>
  );
}