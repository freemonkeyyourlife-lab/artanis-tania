import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2, Copy, Check } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { writePrompt } from "@/lib/promptWriter";

const FIELDS = ["stageName", "personaType", "artStyle", "age", "tagline"];
const STYLES = [
  { id: "FOTO", label: "Fotoreal" },
  { id: "ANIMIERT", label: "Animiert" },
];

const input =
  "w-full px-4 py-2.5 rounded-xl bg-background border border-border text-[15px] font-semibold text-foreground focus:outline-none focus:border-primary/50";

// Stichworte rein, fertiger Prompt raus — mit dem Aussehen des Charakters darin,
// damit alle Bilder zusammenpassen.
export default function KeywordPromptBox() {
  const { toast } = useToast();
  const [creators, setCreators] = useState([]);
  const [creatorId, setCreatorId] = useState("");
  const [style, setStyle] = useState("FOTO");
  const [rough, setRough] = useState("");
  const [result, setResult] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    base44.entities.Creator.filter({}, { sort: "stageName", limit: 300, fields: FIELDS })
      .then((page) => setCreators(page.items || []))
      .catch(() => setCreators([]));
  }, []);

  const character = creators.find((c) => c.id === creatorId) || null;

  const pickCreator = (id) => {
    setCreatorId(id);
    const c = creators.find((x) => x.id === id);
    if (c) setStyle(c.artStyle === "CARTOON" ? "ANIMIERT" : "FOTO");
  };

  const write = async () => {
    if (!rough.trim()) return;
    setBusy(true);
    setResult("");
    try {
      setResult(await writePrompt({ rough, target: "BILD", style, character }));
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
    <div className="rounded-2xl border-2 border-border bg-card p-4 mb-5">
      <p className="font-display text-xl text-foreground mb-1">Stichworte zu einem fertigen Prompt</p>
      <p className="text-[14px] font-semibold text-muted-foreground mb-4 max-w-2xl">
        Schreib in Stichworten, wie das Bild aussehen soll. Wählst du einen Charakter, steckt sein Aussehen mit drin —
        so bleiben alle Bilder dieselbe Person.
      </p>

      <div className="grid sm:grid-cols-3 gap-3 mb-3">
        <select value={creatorId} onChange={(e) => pickCreator(e.target.value)} className={input}>
          <option value="">Ohne Charakter</option>
          {creators.map((c) => (
            <option key={c.id} value={c.id}>{c.stageName}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          {STYLES.map((s) => (
            <button
              key={s.id}
              onClick={() => setStyle(s.id)}
              className={cn(
                "px-4 py-2.5 rounded-full text-[14px] font-bold transition-colors",
                style === s.id ? "glass-btn glass-btn-accent text-gloss" : "glass-btn text-muted-foreground"
              )}
            >
              {s.label}
            </button>
          ))}
        </div>
        <button
          onClick={write}
          disabled={busy || !rough.trim()}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full glass-btn glass-btn-accent text-[15px] font-bold text-gloss disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {busy ? "Wird geschrieben …" : "Prompt erzeugen"}
        </button>
      </div>

      <textarea
        value={rough}
        onChange={(e) => setRough(e.target.value)}
        rows={3}
        placeholder="Zum Beispiel: sitzt am Fenster, Regen, schaut über die Schulter, warmes Licht, rotes Kleid …"
        className={cn(input, "resize-none")}
      />

      {result && !busy && (
        <div className="mt-4">
          <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-2">Fertiger Prompt</p>
          <textarea
            value={result}
            onChange={(e) => setResult(e.target.value)}
            rows={6}
            className={cn(input, "resize-none")}
          />
          <button
            onClick={copy}
            className={cn(
              "mt-3 inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] font-bold transition-colors",
              copied ? "bg-emerald-600/20 text-emerald-400" : "glass-btn text-foreground"
            )}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Kopiert" : "Prompt kopieren"}
          </button>
        </div>
      )}
    </div>
  );
}