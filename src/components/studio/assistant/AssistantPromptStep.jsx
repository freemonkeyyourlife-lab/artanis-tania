import React, { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import VoiceInput from "@/components/VoiceInput";
import PromptResult from "@/components/studio/PromptResult";
import { writePrompt } from "@/lib/promptWriter";
import { blocksToText } from "@/lib/assistant";

// Schritt 6: Sag, was du willst — daraus wird der fertige Prompt, in der Sprache
// des gewählten Modells, mit den Bausteinen und der Stimme im Rücken.
export default function AssistantPromptStep({ creator, model, blocks, voice }) {
  const { toast } = useToast();
  const [idea, setIdea] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

  const write = async (override) => {
    const text = (override ?? idea).trim();
    if (!text) return;
    setBusy(true);
    setResult(null);
    try {
      const blockText = blocksToText(blocks);
      const written = await writePrompt({
        rough: blockText ? `${text}. ${blockText}` : text,
        target: model?.target || "BILD",
        style: creator?.artStyle === "CARTOON" ? "ANIMIERT" : "FOTO",
        character: creator,
        preset: model?.preset || null,
      });
      setResult(written);
    } catch (e) {
      console.error(e);
      toast({ title: "Hat nicht geklappt", description: "Versuch es noch einmal.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <p className="font-display text-xl text-foreground mb-1">Sag, was du willst</p>
      <p className="text-[15px] font-semibold text-muted-foreground mb-4 max-w-2xl">
        Erzähl in eigenen Worten, was zu sehen sein soll — oder sprich es. Der Prompt wird dann in der Sprache von{" "}
        <span className="text-foreground">{model?.name || "deinem Modell"}</span> geschrieben.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        <span className="px-3.5 py-2 rounded-full bg-elevated border border-border text-[13px] font-bold text-foreground">
          {creator?.stageName}
        </span>
        <span className="px-3.5 py-2 rounded-full bg-elevated border border-border text-[13px] font-bold text-foreground">
          {model?.name || "Kein Modell"}
        </span>
        <span className="px-3.5 py-2 rounded-full bg-elevated border border-border text-[13px] font-bold text-foreground">
          {blocks.length} Bausteine
        </span>
        <span className="px-3.5 py-2 rounded-full bg-elevated border border-border text-[13px] font-bold text-foreground">
          {voice?.name || "Keine Stimme"}
        </span>
      </div>

      <div className="flex items-start gap-2 mb-3">
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          rows={4}
          placeholder="Zum Beispiel: Sie steht am Fenster, Regen draußen, schaut über die Schulter zurück, warmes Licht …"
          className="flex-1 px-4 py-3 rounded-2xl bg-card border border-border text-[15px] font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
        />
        <VoiceInput onResult={(text) => setIdea((v) => (v.trim() ? `${v.trim()} ${text}` : text))} className="mt-1 w-12 h-12" />
      </div>

      <button
        onClick={() => write()}
        disabled={busy || !idea.trim()}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass-btn glass-btn-accent text-[15px] font-bold text-gloss disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {busy ? "Wird geschrieben …" : "Prompt schreiben"}
      </button>

      {result && !busy && <PromptResult result={result} onChange={setResult} />}
    </div>
  );
}