import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Sparkles, Loader2, Star, ImagePlus, Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { CARTOON_STYLE, IMAGE_SAFE_RULES, PHOTOREAL } from "@/lib/appearance";
import { uploadDataUrl } from "@/lib/mediaUpload";
import { addGalleryItems } from "@/lib/gallery";

// Bilder direkt im Charakter erzeugen — seine eigenen Bilder sind dabei die Vorlage,
// damit das Gesicht in jedem neuen Bild gleich bleibt.
export default function CharacterImageStudio({ creatorId, name, avatar, referenceImages, onAvatar, onAddReference, onQueue }) {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [animated, setAnimated] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const refs = [avatar, ...(referenceImages || [])]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 6);

  const buildPrompt = () => {
    const style = animated ? CARTOON_STYLE : PHOTOREAL;
    let p = style + IMAGE_SAFE_RULES + " ";
    if (name?.trim() && refs.length) {
      p += `The woman in the reference images is ${name.trim()}. Keep her face, hair colour, hair length, body and skin tone EXACTLY as in her reference images — she must be recognisable. `;
    }
    return p + prompt;
  };

  const generate = async () => {
    if (!prompt.trim()) return;
    setBusy(true);
    setResult(null);
    try {
      const res = await base44.integrations.Core.GenerateImage({
        prompt: buildPrompt(),
        existing_image_urls: refs.length ? refs : undefined,
      });
      setResult(res.url);
    } catch (e) {
      toast({ title: "Hat nicht geklappt", description: "Versuch es mit einem anderen Prompt nochmal.", variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  // Was hier entsteht, landet genauso in der Galerie des Profils wie ein Upload.
  const keep = async (url) => {
    // Bei einem noch nicht gespeicherten Charakter gibt es das Profil noch nicht —
    // dann wandert das Bild in die Warteschlange und wird beim Speichern zum Galerie-Eintrag.
    if (creatorId) await addGalleryItems({ urls: [url], creatorId, creatorName: name });
    else onQueue?.(url);
  };

  const keepAsAvatar = async () => {
    const url = await uploadDataUrl(result, `${name || "charakter"}-hauptbild.png`);
    onAvatar(url);
    await keep(url);
    toast({ title: "Hauptbild gesetzt", description: "Liegt jetzt auch in der Galerie des Profils." });
  };

  const keepAsReference = async () => {
    const url = await uploadDataUrl(result, `${name || "charakter"}-${Date.now()}.png`);
    onAddReference(url);
    await keep(url);
    toast({ title: "Als Referenz gemerkt", description: "Liegt jetzt auch in der Galerie des Profils." });
  };

  return (
    <div className="rounded-2xl border border-primary/25 bg-elevated p-4">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="font-display text-base text-foreground">Bilder erzeugen</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        {refs.length
          ? `Nutzt die ${refs.length} Bilder oben als Vorlage — sie bleibt sie selbst.`
          : "Ohne Vorlage wird frei erfunden. Lade oben erst Bilder hoch, dann bleibt das Gesicht gleich."}
      </p>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        <button
          type="button"
          onClick={() => setAnimated(false)}
          className={cn("px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors", !animated ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground")}
        >
          Fotoreal
        </button>
        <button
          type="button"
          onClick={() => setAnimated(true)}
          className={cn("px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors", animated ? "bg-violet-600/30 text-violet-200" : "bg-card border border-border text-muted-foreground")}
        >
          Animiert
        </button>
      </div>

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        rows={3}
        placeholder="Was soll zu sehen sein? Ort, Pose, Outfit, Licht …"
        className="w-full px-4 py-2.5 rounded-xl bg-card border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
      />

      <button
        type="button"
        onClick={generate}
        disabled={!prompt.trim() || busy}
        className="mt-3 w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        {busy ? "Wird erzeugt …" : "Bild erzeugen"}
      </button>

      {result && !busy && (
        <div className="mt-4">
          <Image src={result} fittingType="fit" className="w-full max-h-80 rounded-xl bg-card" />
          <div className="flex flex-wrap gap-2 mt-3">
            <button type="button" onClick={keepAsAvatar} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
              <Star className="w-3.5 h-3.5" /> Als Hauptbild
            </button>
            <button type="button" onClick={keepAsReference} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-card border border-border text-xs font-medium text-foreground">
              <ImagePlus className="w-3.5 h-3.5" /> Als Referenz
            </button>
            <a href={result} target="_blank" rel="noreferrer" download className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-card border border-border text-xs font-medium text-foreground">
              <Download className="w-3.5 h-3.5" /> Herunterladen
            </a>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Gefällt es nicht? Prompt ändern und nochmal erzeugen.</p>
        </div>
      )}
    </div>
  );
}