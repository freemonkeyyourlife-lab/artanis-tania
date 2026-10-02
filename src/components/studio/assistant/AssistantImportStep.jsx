import React, { useState } from "react";
import { Loader2, Link2, Wand2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { importCharacterFromLink } from "@/lib/creatorImport";
import ImportServicePicker from "@/components/studio/assistant/ImportServicePicker";

// Ein Link genügt: die Seite wird gelesen und daraus ein fertiger Charakter.
export default function AssistantImportStep({ onImported }) {
  const { toast } = useToast();
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!url.trim()) return;
    setBusy(true);
    try {
      const creator = await importCharacterFromLink({ url: url.trim() });
      toast({ title: "Charakter ist da", description: `${creator.stageName} ist angelegt und freigegeben.` });
      setUrl("");
      onImported?.(creator);
    } catch (e) {
      console.error(e);
      toast({ title: "Import hat nicht geklappt", description: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="font-display text-xl text-foreground mb-1">Wen bringst du mit?</p>
      <p className="text-[15px] font-semibold text-muted-foreground mb-4 max-w-2xl">
        Füg den Link einer Charakterseite ein — die Beschreibung wird gelesen, mit unserer Persönlichkeit gemischt und
        als Charakter angelegt. Danach führt der Assistent dich durch Bilder, Modell, Bausteine, Stimme und Prompt.
      </p>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[260px]">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            className="w-full pl-9 h-12 rounded-full bg-card border border-border text-[15px] font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
          />
        </div>
        <button
          onClick={run}
          disabled={busy || !url.trim()}
          className="inline-flex items-center gap-2 px-6 h-12 rounded-full glass-btn glass-btn-accent text-[15px] font-bold text-gloss disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
          {busy ? "Wird gelesen …" : "Importieren"}
        </button>
      </div>

      <p className="mt-4 text-[13px] font-semibold text-muted-foreground">
        Du willst keinen neuen Charakter, sondern einen vorhandenen einrichten? Dann tipp oben auf „2. Charakter“.
      </p>

      <div className="mt-6 pt-5 border-t border-border">
        <p className="font-display text-lg text-foreground mb-3">Oder aus deiner Dienste-Liste</p>
        <ImportServicePicker />
      </div>
    </div>
  );
}