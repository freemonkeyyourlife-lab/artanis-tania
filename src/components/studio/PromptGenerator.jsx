import React, { useState } from "react";
import { Sparkles, Loader2, Copy, Check, Mic } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import VoiceInput from "@/components/VoiceInput";
import { writePrompt } from "@/lib/promptWriter";

const TARGETS = [
  { id: "BILD", label: "Bild" },
  { id: "VIDEO", label: "Video" },
  { id: "TEXT", label: "Text" },
];

const STYLES = [
  { id: "FOTO", label: "Fotoreal" },
  { id: "ANIMIERT", label: "Animiert" },
];

// Aus einer rohen Idee — getippt oder gesprochen — wird ein fertiger Prompt.
export default function PromptGenerator() {
  const { toast } = useToast();
  const [rough, setRough] = useState("");
  const [target, setTarget] = useState("BILD");
  const [style, setStyle] = useState("FOTO");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const write = async () => {
    if (!rough.trim()) return;
    setBusy(true);
    setResult("");
    try {
      setResult(await writePrompt({ rough, target, style }));
    } catch (e) {
      console.error(e);
      toast({ title: "Hat nicht geklappt", description: "Versuch es noch einmal.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (e) {
      /* Zwischenablage verweigert. */
    }
  };

  return (
    <div className="glass rounded-2xl border-2 border-border p-6">
      <p className="font-display text-2xl text-foreground mb-1">Prompt-Generator</p>
      <p className="text-[15px] font-semibold text-muted-foreground max-w-2xl mb-5">
        Schreib oder sprich, was du willst — daraus wird ein fertiger Prompt für Bild, Video oder Text. Zum Kopieren
        und im externen Studio einfügen.
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        {TARGETS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTarget(t.id)}
            className={cn(
              "px-5 py-2.5 rounded-full text-[14px] font-bold transition-colors",
              target === t.id ? "glass-btn glass-btn-accent text-gloss" : "glass-btn text-muted-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
        {target !== "TEXT" && (
          <>
            <span className="w-px h-7 bg-border mx-1" />
            {STYLES.map((s) => (
              <button
                key={s.id}
                onClick={() => setStyle(s.id)}
                className={cn(
                  "px-5 py-2.5 rounded-full text-[14px] font-bold transition-colors",
                  style === s.id ? "glass-btn glass-btn-accent text-gloss" : "glass-btn text-muted-foreground"
                )}
              >
                {s.label}
              </button>
            ))}
          </>
        )}
      </div>

      <div className="flex items-start gap-2 mb-3">
        <textarea
          value={rough}
          onChange={(e) => setRough(e.target.value)}
          rows={4}
          placeholder="Zum Beispiel: Sie sitzt im Café am Fenster, Regen draußen, sie schaut über die Schulter zurück, warmes Licht …"
          className="flex-1 px-4 py-3 rounded-2xl bg-card border border-border text-[15px] font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
        />
        <VoiceInput
          onResult={(text) => setRough((prev) => (prev ? `${prev} ${text}` : text))}
          className="mt-1"
        />
      </div>

      <p className="text-[13px] font-semibold text-muted-foreground mb-3 flex items-center gap-1.5">
        <Mic className="w-3.5 h-3.5" /> Sprechen geht auch — der Text landet direkt im Feld.
      </p>

      <button
        onClick={write}
        disabled={busy || !rough.trim()}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-full glass-btn glass-btn-accent text-[15px] font-bold text-gloss disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {busy ? "Wird geschrieben …" : "In perfekten Prompt umschreiben"}
      </button>

      {result && !busy && (
        <div className="mt-5">
          <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Fertiger Prompt</p>
          <textarea
            value={result}
            onChange={(e) => setResult(e.target.value)}
            rows={7}
            className="w-full px-4 py-3 rounded-2xl bg-card border border-border text-[15px] font-semibold text-foreground focus:outline-none focus:border-primary/50 resize-none"
          />
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <button
              onClick={copy}
              className={cn(
                "inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] font-bold transition-colors",
                copied ? "bg-emerald-600/20 text-emerald-400" : "glass-btn text-foreground"
              )}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copied ? "Kopiert" : "Prompt kopieren"}
            </button>
            <button onClick={write} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[14px] font-bold text-muted-foreground">
              Nochmal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}