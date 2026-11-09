import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Image } from "@/components/ui/image";
import { Loader2, Wand2, ImageIcon, MessageSquare, Clapperboard, Download } from "lucide-react";

// Vorschau & Erstellen: erzeugt aus dem Charakter ein Adventure-Bild,
// einen Roleplay-Text oder einen kurzen Clip. Nutzt die Core-Integrationen
// (GenerateImage, InvokeLLM, GenerateVideo). Fuer die Besitzerin im Studio.

const KINDS = [
  { id: "BILD", label: "Adventure-Bild", icon: ImageIcon, hint: "Ein einzelnes Szenen-Bild" },
  { id: "TEXT", label: "Roleplay-Text", icon: MessageSquare, hint: "Ein kurzer Erzähl-/Dialog-Text" },
  { id: "CLIP", label: "Kurzer Clip", icon: Clapperboard, hint: "6s Clip (dauert ~30–60s)" },
];

export default function ErstellenPanel({ character }) {
  const { toast } = useToast();
  const [kind, setKind] = useState("BILD");
  const [prompt, setPrompt] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  if (!character) return null;

  const base = [
    `Charakter: ${character.name}.`,
    character.appearance ? `Aussehen: ${character.appearance}.` : "",
    character.personality ? `Persönlichkeit: ${character.personality}.` : "",
    character.description ? `Beschreibung: ${character.description}.` : "",
  ].filter(Boolean).join(" ");

  const run = async () => {
    if (busy) return;
    setBusy(true);
    setResult(null);
    try {
      const full = prompt.trim() ? `${base}\n\nSzene/Wunsch: ${prompt}` : base;
      if (kind === "BILD") {
        const res = await base44.integrations.Core.GenerateImage({ prompt: `${full}. Bildstil: fotorealistisch, stimmungsvoll.` });
        setResult({ type: "image", url: res?.url });
      } else if (kind === "TEXT") {
        const res = await base44.integrations.Core.InvokeLLM({
          prompt: `Schreibe als ${character.name} einen kurzen, stimmungsvollen Roleplay-Text (2–4 Sätze) zu dieser Szene. ${full}`,
        });
        setResult({ type: "text", text: typeof res === "string" ? res : res?.content || JSON.stringify(res) });
      } else {
        const res = await base44.integrations.Core.GenerateVideo({
          prompt: `${full}. Kurze filmische Szene, stimmungsvoll.`,
          duration: 6,
          aspect_ratio: "16:9",
        });
        setResult({ type: "video", url: res?.url });
      }
      toast({ title: "Erstellt" });
    } catch (e) {
      toast({ variant: "destructive", title: "Fehlgeschlagen", description: e?.message });
    } finally {
      setBusy(false);
    }
  };

  const active = KINDS.find((k) => k.id === kind);

  return (
    <div className="glass rounded-2xl border border-border p-4">
      <div className="mb-3 flex items-center gap-2 font-display text-lg text-foreground">
        <Wand2 className="h-4 w-4 text-primary" /> Vorschau & Erstellen
      </div>
      <p className="text-[12px] text-muted-foreground">
        Aus {character.name} direkt etwas machen — {active.hint}.
      </p>

      {/* Art-Wahl */}
      <div className="mt-3 grid grid-cols-3 gap-2">
        {KINDS.map((k) => (
          <button key={k.id} onClick={() => setKind(k.id)} title={k.hint}
            className={"rounded-xl border-2 px-2 py-2 text-center transition-colors " + (kind === k.id ? "border-primary bg-primary/10" : "border-border bg-elevated hover:border-primary/50")}>
            <k.icon className="mx-auto h-4 w-4 text-primary" />
            <p className="mt-1 text-[11px] text-foreground">{k.label}</p>
          </button>
        ))}
      </div>

      {/* Prompt */}
      <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)}
        placeholder={kind === "BILD" ? "Szene beschreiben, z. B. „im Wald bei Dämmerung, sehnsüchtig" :
          kind === "TEXT" ? "Thema/Stimmung, z. B. „zärtliche Begrüßung nach Tagen" :
          "Clip-Idee, z. B. „Blick aus dem Fenster, lächelnd"}
        rows={2}
        className="mt-3 w-full rounded-xl bg-background px-3 py-2 text-sm text-foreground" />

      <button onClick={run} disabled={busy} title="Aus dieser Figur die gewählte Art erzeugen"
        className="glass-btn glass-btn-accent mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-4 py-2.5 text-sm disabled:opacity-50">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
        {busy ? "Erstellt …" : `${active.label} erstellen`}
      </button>

      {/* Ergebnis */}
      {result && (
        <div className="mt-4 rounded-2xl border border-border bg-background p-3">
          {result.type === "image" && (
            <>
              <Image src={result.url} fittingType="fit" className="w-full rounded-xl" />
              <a href={result.url} download target="_blank" rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs text-primary"><Download className="h-3.5 w-3.5" /> Bild öffnen</a>
            </>
          )}
          {result.type === "text" && (
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground">{result.text}</p>
          )}
          {result.type === "video" && (
            <video src={result.url} controls className="w-full rounded-xl" />
          )}
        </div>
      )}
    </div>
  );
}