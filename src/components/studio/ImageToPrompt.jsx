import React, { useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image as ImageIcon, Loader2, ScanEye, X } from "lucide-react";
import ImagePromptResult from "@/components/studio/ImagePromptResult";

const SCHEMA = {
  type: "object",
  properties: {
    prompt: { type: "string" },
    negative: { type: "string" },
    subject: { type: "string" },
    setting: { type: "string" },
    style: { type: "string" },
    light: { type: "string" },
    colors: { type: "string" },
    camera: { type: "string" },
  },
};

const INSTRUCTION = `Du siehst ein Bild. Schreibe daraus einen fertigen Prompt, mit dem ein Bildgenerator dieselbe Aufnahme neu bauen kann — egal, was zu sehen ist: eine Person, ein Raum, ein Fahrzeug, eine Landschaft, ein Gegenstand.

Beschreibe zuerst, WAS zu sehen ist, und dann, WO es steht. Nenne die Dinge beim Namen: das Flugzeug, die Sitzreihe, die Fenster, der Tisch, das Glas, die Wand, das Geländer. Erfinde nichts dazu, was nicht im Bild ist — aber lass nichts weg, was die Aufnahme ausmacht.

Achte auf: Motiv und Haltung, Umgebung und alle Gegenstände darin, Licht und Tageszeit, Farbstimmung, Material und Oberfläche, Kamera, Ausschnitt und Blickwinkel, Stil und Medium.

Antworte auf Deutsch. "prompt" ist der fertige Satz zum Einfügen (drei bis fünf Sätze, keine Aufzählung, keine Anführungszeichen).
"negative" sind die Dinge, die nicht ins Bild sollen — Gegenstände, die dort nicht hingehören, falsche Stimmung, typische Fehler (leer lassen, wenn nichts nötig).
"subject" ist das Motiv in einem Halbsatz. "setting" ist die Umgebung mit ihren Gegenständen in einem Halbsatz.
"style", "light", "colors" und "camera" sind je ein kurzer Halbsatz.`;

// Ein Bild hinein — ein fertiger Prompt heraus. Die App liest das Bild selbst,
// dafür braucht es keine fremde Seite.
export default function ImageToPrompt() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const inputRef = useRef(null);

  const pick = (f) => {
    if (!f) return;
    setFile(f);
    setResult(null);
    setError("");
    setPreview(URL.createObjectURL(f));
  };

  const reset = () => {
    setFile(null);
    setPreview("");
    setResult(null);
    setError("");
  };

  const read = async () => {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const { file_uri } = await base44.integrations.Core.UploadPrivateFile({ file });
      const { signed_url } = await base44.integrations.Core.CreateFileSignedUrl({ file_uri, expires_in: 900 });
      const res = await base44.integrations.Core.InvokeLLM({
        prompt: INSTRUCTION,
        file_urls: [signed_url],
        response_json_schema: SCHEMA,
      });
      setResult(res);
    } catch (e) {
      setError("Das Bild konnte nicht gelesen werden. Versuch es noch einmal.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass rounded-2xl border border-border p-5">
      <div className="flex items-center gap-2 mb-1">
        <ScanEye className="w-5 h-5 text-primary" />
        <h2 className="text-[17px] font-bold text-foreground">Bild auslesen</h2>
      </div>
      <p className="text-[13px] font-semibold text-muted-foreground mb-4 max-w-3xl leading-relaxed">
        Lade ein Bild hoch — die App liest Motiv, Umgebung und alle Gegenstände darin, dazu Licht, Farben und
        Ausschnitt, und schreibt daraus den fertigen Prompt. Für alles: Figuren, Räume, Fahrzeuge, Landschaften,
        Gegenstände. Aus einem Video ziehst du vorher ein Einzelbild heraus.
      </p>

      {!preview ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-2 py-10 rounded-xl border border-dashed border-border bg-background text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
        >
          <ImageIcon className="w-7 h-7" />
          <span className="text-[14px] font-bold">Bild auswählen</span>
          <span className="text-[12px] font-semibold">PNG, JPG oder WEBP</span>
        </button>
      ) : (
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative w-full sm:w-56 flex-shrink-0">
            <img src={preview} alt="Vorlage" className="w-full h-40 object-cover rounded-xl border border-border" />
            <button
              onClick={reset}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-background/80 border border-border flex items-center justify-center text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <button
              onClick={read}
              disabled={busy}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full glass-btn glass-btn-accent text-[14px] font-bold disabled:opacity-60"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanEye className="w-4 h-4" />}
              {busy ? "Liest das Bild…" : "Prompt daraus schreiben"}
            </button>
            {error && <p className="text-[13px] font-semibold text-destructive mt-2">{error}</p>}
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => pick(e.target.files?.[0])}
      />

      <ImagePromptResult result={result} />
    </div>
  );
}