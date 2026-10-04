import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";

// Was aus der Zusammenstellung wird: ein Text zum Mitnehmen, plus der Zusatz
// für die Stimme.
export default function BriefingBox({ text, voiceDelta, tone }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text || "");
    } catch {
      const el = document.createElement("textarea");
      el.value = text || "";
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="font-heading">Fertig zusammengestellt</div>
          <div className="text-xs text-muted-foreground">Ton: {tone}</div>
        </div>
        <Button size="sm" onClick={copy} disabled={!text}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          <span className="ml-2">{copied ? "Kopiert" : "Kopieren"}</span>
        </Button>
      </div>

      <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-xl bg-muted p-3 text-sm">
        {text || "Wähle links Neigungen und Bausteine — hier wächst die Anweisung."}
      </pre>

      <div className="mt-3 text-xs text-muted-foreground">
        Stimme dazu: Tempo {voiceDelta.speed >= 0 ? "+" : ""}
        {voiceDelta.speed.toFixed(2)} · Tiefe {voiceDelta.depth >= 0 ? "+" : ""}
        {voiceDelta.depth} · Klang {voiceDelta.style.toFixed(2)}
      </div>
    </div>
  );
}