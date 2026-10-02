import React, { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import ModelPresetPicker from "@/components/studio/ModelPresetPicker";
import PromptResult from "@/components/studio/PromptResult";
import { writePrompt } from "@/lib/promptWriter";
import { presetById } from "@/lib/modelPrompts";

// Aus dem Chat heraus: die letzten Zeilen werden zur Idee, daraus entsteht auf
// Anfrage ein fertiger Prompt — zum Kopieren, Bearbeiten und Aufklappen.
export default function ChatPromptButton({ messages = [], title = "Szene" }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [choice, setChoice] = useState({ modelId: "", presetId: "ALLGEMEIN" });
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [big, setBig] = useState(false);

  const lines = messages.filter((m) => m.senderType !== "SYSTEM" && (m.text || "").trim()).length;

  const rough = () =>
    messages
      .filter((m) => m.senderType !== "SYSTEM" && (m.text || "").trim())
      .slice(-12)
      .map((m) => `${m.senderType === "HUMAN" ? "Ich" : m.sender || title}: ${m.text}`)
      .join("\n")
      .slice(-1600);

  const write = async () => {
    const text = rough();
    if (!text) {
      toast({ title: "Noch nichts da", description: "Sobald im Chat etwas geschrieben wurde, kann daraus ein Prompt werden." });
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      setResult(
        await writePrompt({
          rough: text,
          target: "BILD",
          style: "FOTO",
          preset: presetById(choice.presetId),
        })
      );
    } catch (e) {
      console.error(e);
      toast({ title: "Hat nicht geklappt", description: "Versuch es noch einmal.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (v) write(); }}>
      <DialogTrigger asChild>
        <button
          title="Aus diesem Chat einen fertigen Prompt machen"
          className="w-8 h-8 rounded-full bg-elevated text-muted-foreground flex items-center justify-center flex-shrink-0 hover:text-foreground transition-colors"
        >
          <Sparkles className="w-4 h-4" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="font-display text-lg text-foreground">Prompt aus dem Chat</h3>
        <p className="text-xs text-muted-foreground">
          {lines} Zeile{lines === 1 ? "" : "n"} aus „{title}" — daraus wird ein Prompt fürs externe Studio.
        </p>

        <div className="mt-4">
          <ModelPresetPicker value={choice} onChange={setChoice} />
        </div>

        {busy && (
          <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin text-primary" /> Wird geschrieben …
          </div>
        )}

        {result && !busy && (
          <>
            <PromptResult result={result} onChange={setResult} />
            <button
              onClick={() => setBig((v) => !v)}
              className="mt-3 text-[13px] font-bold text-primary hover:underline"
            >
              {big ? "Kleiner anzeigen" : "Größer anzeigen"}
            </button>
          </>
        )}

        <div className="flex flex-wrap gap-2 mt-4">
          <button
            onClick={write}
            disabled={busy}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn glass-btn-accent text-[14px] font-bold text-gloss disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Nochmal
          </button>
        </div>

        {big && (
          <div className="mt-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Der ganze Chat</p>
            <pre className="whitespace-pre-wrap break-words rounded-2xl border border-border bg-card p-4 text-[13px] font-semibold text-muted-foreground max-h-72 overflow-y-auto">
              {rough()}
            </pre>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}