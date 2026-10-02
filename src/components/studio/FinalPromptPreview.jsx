import React, { useState } from "react";
import { Eye, EyeOff, Copy } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// Zeigt genau den Prompt, der beim Klick auf Generieren rausgeht —
// so sieht man, dass jeder Regler wirklich im Bild ankommt.
export default function FinalPromptPreview({ text }) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    toast({ title: "Prompt kopiert" });
  };

  return (
    <div className="rounded-xl border border-border bg-background p-3">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 text-[12px] font-bold text-muted-foreground hover:text-foreground"
        >
          {open ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          Finaler Prompt {open ? "ausblenden" : "ansehen"}
        </button>
        {open && (
          <button type="button" onClick={copy} className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-primary">
            <Copy className="w-3 h-3" /> Kopieren
          </button>
        )}
      </div>
      {open && <p className="mt-2 text-[12px] font-medium text-foreground/80 leading-relaxed whitespace-pre-wrap">{text}</p>}
    </div>
  );
}