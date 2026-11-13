import React, { useState, useRef } from "react";
import { Image as ImageIcon, Loader2, Upload, Send, Share2, Download, X } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { therapistName } from "@/lib/therapyPrompts";
import { sceneImagePrompt, charRefImages } from "@/lib/therapyVisual";
import { useToast } from "@/components/ui/use-toast";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

// Bild direkt aus dem Therapie-Chat: aus Text, aus einem hochgeladenen
// Vorlagen-Bild oder beides gemischt. Das Ergebnis fällt als AI-Nachricht
// in den Verlauf und lässt sich per Link teilen.
export default function TherapyBildButton({ session, initialText, disabled, className }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [upload, setUpload] = useState("");
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef(null);
  const { toast } = useToast();

  const openDialog = () => {
    setText(initialText || "");
    setUpload("");
    setResult("");
    setError("");
    setOpen(true);
  };

  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploading(true);
    setError("");
    try {
      const up = await base44.integrations.Core.UploadPublicFile({ file: f });
      setUpload(up.file_url);
    } catch {
      setError("Upload fehlgeschlagen.");
    } finally {
      setUploading(false);
    }
  };

  const generate = async () => {
    if ((!text.trim() && !upload) || busy) return;
    setBusy(true);
    setError("");
    setResult("");
    try {
      const prompt = sceneImagePrompt(session, text.trim());
      // Die Originalcharaktere der Sitzung stehen immer vorne — nur so bleibt
      // jedes Bild bei ihrem Aussehen. Ein hochgeladenes Vorlagen-Bild kommt
      // zusätzlich dazu, ersetzt sie aber nie.
      const refs = [...charRefImages(session), ...(upload ? [upload] : [])];
      const r = await base44.integrations.Core.GenerateImage({
        prompt,
        existing_image_urls: refs.length ? refs : undefined,
      });
      const url = r?.url;
      if (!url) throw new Error("Kein Ergebnis vom Generator.");
      setResult(url);
      await base44.entities.TherapyMessage.create({
        sessionId: session.id,
        senderType: "AI",
        senderName: therapistName(session),
        text: text.trim() ? `Bild zu: ${text.trim().slice(0, 120)}` : "Ein Bild aus der Szene.",
        images: [url],
      });
      toast({ title: "Bild erzeugt", description: "Es steht im Verlauf." });
    } catch (e) {
      setError(e?.message || "Erzeugung fehlgeschlagen.");
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    if (!result) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Bild", text: text.trim(), url: result });
        return;
      } catch {}
    }
    try {
      await navigator.clipboard.writeText(result);
      toast({ title: "Link kopiert", description: "Bild-Link in der Zwischenablage." });
    } catch {
      toast({ variant: "destructive", title: "Teilen fehlgeschlagen" });
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        disabled={disabled}
        title="Bild aus Text oder Upload generieren"
        className={cn(
          "w-10 h-10 rounded-full bg-elevated text-muted-foreground hover:text-foreground flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-50",
          className
        )}
      >
        <ImageIcon className="w-4 h-4" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <h3 className="font-display text-lg text-foreground mb-1">Bild generieren</h3>
          <p className="text-xs text-muted-foreground mb-4">
            Beschreib, was du sehen willst — oder lade ein Bild als Vorlage hoch und mische es mit deinem Text.
          </p>

          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder="Z. B. Tania am Fenster im Morgenlicht, weiches Seidenkleid, halb abgerückt …"
            className="w-full px-4 py-3 rounded-2xl bg-background border border-border text-sm text-foreground caret-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none mb-3"
          />

          {upload ? (
            <div className="relative mb-3">
              <Image src={upload} className="w-full rounded-2xl max-h-52" fittingType="fit" />
              <button
                type="button"
                onClick={() => setUpload("")}
                className="absolute top-2 right-2 w-7 h-7 rounded-full bg-background/80 border border-border flex items-center justify-center"
                title="Vorlage entfernen"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full mb-3 px-4 py-3 rounded-2xl border-2 border-dashed border-border text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2"
            >
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploading ? "Lade Vorlage hoch …" : "Bild als Vorlage hochladen (optional)"}
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" onChange={onFile} className="hidden" />

          {error && <p className="text-[11px] text-destructive mb-3">{error}</p>}

          {result && (
            <div className="mb-3">
              <Image src={result} className="w-full rounded-2xl" />
            </div>
          )}

          <div className="flex items-center gap-2 justify-end">
            {result && (
              <a
                href={result}
                download
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-elevated text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <Download className="w-3.5 h-3.5" /> Bild
              </a>
            )}
            {result && (
              <button
                type="button"
                onClick={share}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-elevated text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" /> Teilen
              </button>
            )}
            <button
              type="button"
              onClick={generate}
              disabled={busy || (!text.trim() && !upload)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Generieren
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}