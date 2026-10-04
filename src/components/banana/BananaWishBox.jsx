import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Sparkles } from "lucide-react";
import SpeakField from "@/components/voice/SpeakField";
import CopyBlock from "@/components/banana/CopyBlock";
import ArchiveUpload from "@/components/images/ArchiveUpload";
import { BANANA_MODULES } from "@/lib/bananaModules";

// Sag in eigenen Worten, was du willst — sprechen oder tippen. Daraus wird ein
// fertiger Prompt, mit Modell, Schaltern und der Begründung dazu.
const CATALOG = BANANA_MODULES.map(
  (m) => `${m.id} | ${m.title} | ${m.goal} | ${m.model} | ${m.params}`
).join("\n");

const SCHEMA = {
  type: "object",
  properties: {
    moduleTitle: { type: "string" },
    model: { type: "string" },
    params: { type: "string" },
    prompt: { type: "string" },
    why: { type: "string" },
    watch: { type: "array", items: { type: "string" } },
    missing: { type: "array", items: { type: "string" } },
  },
  required: ["moduleTitle", "model", "params", "prompt", "why"],
};

export default function BananaWishBox() {
  const [wish, setWish] = useState("");
  const [images, setImages] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const build = async () => {
    if (!wish.trim() || busy) return;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const out = await base44.integrations.Core.InvokeLLM({
        prompt: `Du hilfst beim Bildermachen mit dem Modell „Nano Banana" (Google, über fal.ai).
Der Nutzer sagt in eigenen Worten, was er will. Daraus baust du einen fertigen, kopierfertigen Prompt.

Wähle das am besten passende Modul aus dieser Liste:
${CATALOG}

Regeln:
- Antworte auf Deutsch.
- Der Prompt ist fertig ausgefüllt. Keine Platzhalter in eckigen Klammern mehr, außer eine Angabe fehlt wirklich und lässt sich nicht sinnvoll erraten.
- Bei Edit-Modulen: nur die Änderung beschreiben und ausdrücklich festhalten, was unverändert bleibt (Gesicht, Pose, Licht, Hintergrund).
- "params" ist eine kurze Zeile mit den passenden Schaltern, z. B. image_urls: [Bild 1] · aspect_ratio: 3:4.
- "why" erklärt in ein bis zwei Sätzen, warum dieses Modell und diese Schalter.
- "watch" sind zwei bis vier kurze Hinweise, was bei genau diesem Motiv schiefgehen kann.
- "missing" listet, was der Nutzer noch liefern muss, z. B. "ein Vorlagenbild mit scharfem Gesicht". Wenn nichts fehlt, lass die Liste leer.
- Keine sexuellen oder nackten Inhalte: Google blockiert das. Sag das in dem Fall offen in "why".
${images.length
  ? `- Der Nutzer hat ${images.length} Vorlagenbild(er) beigelegt (${images.map((_, i) => `Bild ${i + 1}`).join(", ")}). Wenn er ein vorhandenes Bild ändern will, nimm ein Edit-Modul und setze in "params" image_urls: [${images.map((_, i) => `Bild ${i + 1}`).join(", ")}].`
  : "- Der Nutzer hat kein Vorlagenbild beigelegt."}

Wunsch des Nutzers:
"""${wish}"""`,
        response_json_schema: SCHEMA,
      });
      setResult(out);
    } catch (e) {
      setError("Das hat gerade nicht geklappt. Versuch es noch einmal.");
    } finally {
      setBusy(false);
    }
  };

  const chip = "px-2.5 py-1 rounded-full bg-elevated border border-border text-[11px] font-bold";

  return (
    <section className="mb-10 rounded-2xl glass border-2 border-primary/40 p-5">
      <h2 className="text-xl font-display text-foreground flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" /> Sag mir, was du willst
      </h2>
      <p className="text-[13px] font-semibold text-muted-foreground mt-1 mb-3">
        Sprechen oder tippen — ich baue daraus den fertigen Prompt, wähle das Modell und sage dir, warum.
      </p>

      <SpeakField
        value={wish}
        onChange={setWish}
        rows={3}
        placeholder="Zum Beispiel: Dieselbe Frau wie auf dem Foto, aber im roten Kleid auf einer Dachterrasse bei Sonnenuntergang."
      />

      <div className="mt-3">
        <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
          Vorlagenbilder — sie werden zu Bild 1, Bild 2 …
        </p>
        <ArchiveUpload value={images} onChange={setImages} kind="BAUSATZ" />
      </div>

      <div className="flex items-center gap-2 mt-3">
        <button
          onClick={build}
          disabled={!wish.trim() || busy}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn glass-btn-accent text-[13px] font-bold text-gloss disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {busy ? "Ich baue deinen Prompt…" : "Prompt bauen"}
        </button>
        {wish && (
          <button
            onClick={() => { setWish(""); setImages([]); setResult(null); setError(""); }}
            className="px-4 py-2.5 rounded-full glass-btn text-[13px] font-bold text-muted-foreground hover:text-foreground transition-colors"
          >
            Leeren
          </button>
        )}
      </div>

      {error && <p className="mt-3 text-[13px] font-bold text-destructive">{error}</p>}

      {result && (
        <div className="mt-4 rounded-2xl bg-elevated border border-border p-4">
          <div className="flex flex-wrap gap-1.5">
            <span className={`${chip} text-foreground`}>{result.moduleTitle}</span>
            <span className={`${chip} text-primary`}>{result.model}</span>
            <span className={`${chip} text-muted-foreground`}>{result.params}</span>
          </div>

          {result.why && (
            <p className="text-[13px] font-semibold text-foreground/85 mt-2">{result.why}</p>
          )}

          <CopyBlock text={result.prompt} className="mt-3" />

          {images.length > 0 && (
            <div className="mt-3">
              <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Diese Adressen sind {images.map((_, i) => `Bild ${i + 1}`).join(", ")}
              </p>
              <CopyBlock text={images.join("\n")} />
            </div>
          )}

          {(result.watch || []).length > 0 && (
            <div className="mt-3 space-y-1.5">
              {(result.watch || []).map((w) => (
                <p key={w} className="text-[12.5px] font-semibold text-foreground/85 flex gap-2">
                  <span className="text-primary">•</span>
                  <span>{w}</span>
                </p>
              ))}
            </div>
          )}

          {(result.missing || []).length > 0 && (
            <p className="mt-3 text-[12.5px] font-bold text-primary">
              Das brauche ich noch von dir: {(result.missing || []).join(" · ")}
            </p>
          )}
        </div>
      )}
    </section>
  );
}