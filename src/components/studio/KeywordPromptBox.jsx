import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Sparkles, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import VoiceInput from "@/components/VoiceInput";
import ModelPresetPicker from "@/components/studio/ModelPresetPicker";
import PromptResult from "@/components/studio/PromptResult";
import { writePrompt } from "@/lib/promptWriter";
import { presetById } from "@/lib/modelPrompts";

const FIELDS = ["stageName", "personaType", "artStyle", "age", "tagline"];
const STYLES = [
  { id: "FOTO", label: "Fotoreal" },
  { id: "ANIMIERT", label: "Animiert" },
];

const input =
  "w-full px-4 py-2.5 rounded-xl bg-background border border-border text-[15px] font-semibold text-foreground focus:outline-none focus:border-primary/50";

// Sprechen oder tippen — heraus kommt ein fertiger Prompt in der Sprache des
// gewählten Modells, mit dem Aussehen des Charakters darin.
export default function KeywordPromptBox() {
  const { toast } = useToast();
  const [creators, setCreators] = useState([]);
  const [creatorId, setCreatorId] = useState("");
  const [style, setStyle] = useState("FOTO");
  const [choice, setChoice] = useState({ modelId: "", presetId: "ALLGEMEIN" });
  const [rough, setRough] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);

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

  // Sprechen ist der kurze Weg: das Gesagte wird sofort zum fertigen Prompt.
  const speak = (text) => {
    const next = rough.trim() ? `${rough.trim()} ${text}` : text;
    setRough(next);
    write(next);
  };

  const write = async (override) => {
    const text = (override ?? rough).trim();
    if (!text) return;
    setBusy(true);
    setResult(null);
    try {
      setResult(
        await writePrompt({
          rough: text,
          target: "BILD",
          style,
          character,
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
    <div className="rounded-2xl border-2 border-border bg-card p-4 mb-5">
      <p className="font-display text-xl text-foreground mb-1">Idee rein, fertiger Prompt raus</p>
      <p className="text-[14px] font-semibold text-muted-foreground mb-4 max-w-2xl">
        Sprich oder tippe, wie das Bild aussehen soll. Wählst du einen Charakter, steckt sein Aussehen mit drin — so
        bleiben alle Bilder dieselbe Person.
      </p>

      <ModelPresetPicker value={choice} onChange={setChoice} />

      <div className="grid sm:grid-cols-2 gap-3 mb-3">
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
          <button
            onClick={() => write()}
            disabled={busy || !rough.trim()}
            className="ml-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full glass-btn glass-btn-accent text-[15px] font-bold text-gloss disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {busy ? "Wird geschrieben …" : "Prompt erzeugen"}
          </button>
        </div>
      </div>

      <div className="flex items-start gap-2">
        <textarea
          value={rough}
          onChange={(e) => setRough(e.target.value)}
          rows={3}
          placeholder="Zum Beispiel: sitzt am Fenster, Regen, schaut über die Schulter, warmes Licht, rotes Kleid …"
          className={cn(input, "resize-none flex-1")}
        />
        <VoiceInput
          onResult={speak}
          className="w-12 h-12"
          title="Sprechen — der Prompt kommt von selbst"
        />
      </div>

      <p className="mt-2 text-[13px] font-semibold text-muted-foreground">
        Auf das Mikrofon tippen und erzählen, was du willst — der fertige Prompt erscheint von selbst. Tippen geht
        genauso.
      </p>

      {result && !busy && <PromptResult result={result} onChange={setResult} />}
    </div>
  );
}