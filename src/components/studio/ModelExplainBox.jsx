import React, { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { explainModel } from "@/lib/modelExplain";

// Was das Modell kann und wofür es taugt — direkt am Modell, damit man für das
// jeweilige Bild oder Video das beste auswählen kann.
export default function ModelExplainBox({ model, kind = "BILD", className, onSave }) {
  const [busy, setBusy] = useState(false);

  const generate = async () => {
    setBusy(true);
    try {
      const description = await explainModel({
        name: model.name,
        modelId: model.modelId,
        source: model.source,
        kind,
      });
      if (description) await onSave(description);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn("mt-2 rounded-xl bg-background/60 border border-border px-3 py-2", className)}>
      <p className={cn("text-[12px] leading-relaxed", model.description ? "text-muted-foreground" : "text-muted-foreground italic")}>
        {model.description || "Noch keine Erklärung hinterlegt."}
      </p>
      <button
        type="button"
        onClick={generate}
        disabled={busy}
        className="inline-flex items-center gap-1.5 mt-1.5 text-[11px] font-semibold text-primary hover:text-primary/80 disabled:opacity-50 transition-colors"
      >
        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
        {busy ? "Wird erklärt …" : model.description ? "Neu erklären lassen" : "Erklären lassen"}
      </button>
    </div>
  );
}