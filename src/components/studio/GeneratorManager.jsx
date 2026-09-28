import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Sparkles, Loader2, Video, Bookmark, Plus } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { CARTOON_STYLE, IMAGE_SAFE_RULES, PHOTOREAL } from "@/lib/appearance";
import { uploadDataUrl } from "@/lib/mediaUpload";

// Eigene Bilder und Videos bauen: Person wählen, Prompt drunter, fertig.
export default function GeneratorManager({ creators }) {
  const [creatorId, setCreatorId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [animated, setAnimated] = useState(false);
  const [extraRefs, setExtraRefs] = useState([]);
  const [models, setModels] = useState([]);
  const [modelId, setModelId] = useState("");
  const [busy, setBusy] = useState(null);
  const [result, setResult] = useState(null);
  const { toast } = useToast();

  // Zusätzliche Modelle, die im Studio unter "Modelle" freigeschaltet sind.
  useEffect(() => {
    base44.entities.ImageModel.filter({ enabled: true }, "created_date", 100)
      .then(setModels)
      .catch(() => setModels([]));
  }, []);

  const creator = creators.find((c) => c.id === creatorId);
  const refs = [creator?.avatar, ...(creator?.referenceImages || []), ...extraRefs]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 6);

  const buildPrompt = () => {
    const style = animated ? CARTOON_STYLE : PHOTOREAL;
    let p = style + IMAGE_SAFE_RULES + " ";
    if (creator) {
      p += `The woman in the reference images is ${creator.stageName}. Keep her face, hair colour, hair length, body and skin tone EXACTLY as in her reference images — she must be recognisable. `;
    }
    p += prompt;
    return p;
  };

  const generateImage = async () => {
    if (!prompt.trim()) return;
    setBusy("image");
    setResult(null);
    try {
      if (modelId) {
        // Über ein eigenes Modell auf Hugging Face
        const res = await base44.functions.invoke("hfGenerate", { modelId, prompt: buildPrompt() });
        if (res.data?.error) throw new Error(res.data.error);
        setResult({ type: "image", url: res.data.imageUrl });
      } else {
        const res = await base44.integrations.Core.GenerateImage({
          prompt: buildPrompt(),
          existing_image_urls: refs.length ? refs : undefined,
        });
        setResult({ type: "image", url: res.url });
      }
    } catch (e) {
      toast({ title: "Hat nicht geklappt", description: e.message || "Versuch es mit einem anderen Modell oder Prompt nochmal.", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  const generateVideo = async () => {
    if (!prompt.trim()) return;
    setBusy("video");
    setResult(null);
    try {
      const res = await base44.integrations.Core.GenerateVideo({
        prompt: (creator ? `The woman looks exactly like ${creator.stageName}. ` : "") + prompt,
        duration: 6,
        aspect_ratio: "9:16",
      });
      setResult({ type: "video", url: res.url });
    } catch (e) {
      toast({ title: "Hat nicht geklappt", description: "Video dauert länger — versuch es nochmal.", variant: "destructive" });
    } finally {
      setBusy(null);
    }
  };

  // Mehrere eigene Bilder auf einmal — je mehr Vorlagen, desto gleichmäßiger das Gesicht.
  const uploadRefs = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    try {
      const urls = [];
      for (const file of files) {
        const res = await base44.integrations.Core.UploadPublicFile({ file });
        urls.push(res.file_url);
      }
      setExtraRefs((prev) => [...prev, ...urls].filter((v, i, a) => a.indexOf(v) === i).slice(0, 6));
    } catch (err) {
      toast({ title: "Upload fehlgeschlagen", variant: "destructive" });
    }
    e.target.value = "";
  };

  const saveAsReference = async () => {
    if (!creator || !result) return;
    const url = await uploadDataUrl(result.url, `${creator.stageName}.png`);
    await base44.entities.Creator.update(creator.id, {
      referenceImages: [...(creator.referenceImages || []), url].filter((v, i, a) => a.indexOf(v) === i),
    });
    toast({ title: "Gemerkt", description: `${creator.stageName} sieht ab jetzt so aus.` });
  };

  const saveAsContent = async () => {
    if (!creator || !result) return;
    const url = await uploadDataUrl(result.url, `${creator.stageName}-${Date.now()}.png`);
    await base44.entities.Content.create({
      creatorId: creator.id,
      creatorName: creator.stageName,
      title: prompt.slice(0, 60) || creator.stageName,
      contentType: result.type === "video" ? "VIDEO" : "PHOTO",
      thumbnail: result.type === "video" ? null : url,
      previewAsset: url,
      fullAsset: url,
      isFree: true,
      price: 0,
      visibility: "PUBLIC",
      published: true,
      ageRestricted: true,
    });
    toast({ title: "Drin", description: "Liegt jetzt bei den Inhalten dieser Person." });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-xl text-foreground mb-1">Bilder & Videos bauen</h2>
        <p className="text-xs text-muted-foreground mb-5">Person wählen, Prompt drunter — sie bleibt immer sie selbst.</p>

        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Person</label>
        <select
          value={creatorId}
          onChange={(e) => setCreatorId(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground mb-4"
        >
          <option value="">Ohne Person</option>
          {creators.map((c) => (
            <option key={c.id} value={c.id}>{c.stageName}</option>
          ))}
        </select>

        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Quelle</label>
        <select
          value={modelId}
          onChange={(e) => setModelId(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground mb-4"
        >
          <option value="">Standard-Generator</option>
          {models.map((m) => (
            <option key={m.id} value={m.modelId}>{m.name}</option>
          ))}
        </select>

        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Prompt</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={6}
          placeholder="Was soll zu sehen sein? Ort, Pose, Outfit, Licht …"
          className="w-full px-4 py-3 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground resize-none mb-4"
        />

        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button
            onClick={() => setAnimated((v) => !v)}
            className={cn("px-4 py-2 rounded-full text-xs font-semibold transition-colors", animated ? "bg-violet-600/25 text-violet-300" : "bg-elevated border border-border text-muted-foreground")}
          >
            {animated ? "Animiert ✓" : "Animiert"}
          </button>
          <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-elevated border border-border text-xs text-muted-foreground cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> Eigene Bilder
            <input type="file" accept="image/*" multiple onChange={uploadRefs} className="hidden" />
          </label>
          {extraRefs.map((url) => (
            <div key={url} className="relative">
              <Image src={url} fittingType="fill" className="w-10 h-10 rounded-lg" />
              <button onClick={() => setExtraRefs((prev) => prev.filter((u) => u !== url))} className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-white text-[10px] leading-none">×</button>
            </div>
          ))}
        </div>

        {refs.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-5">
            {refs.map((r) => (
              <Image key={r} src={r} fittingType="fill" className="w-12 h-12 rounded-lg" />
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={generateImage}
            disabled={!prompt.trim() || !!busy}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
          >
            {busy === "image" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Bild
          </button>
          <button
            onClick={generateVideo}
            disabled={!prompt.trim() || !!busy}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-elevated border border-border text-sm font-semibold text-foreground disabled:opacity-50"
          >
            {busy === "video" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Video className="w-4 h-4" />}
            Video
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 flex flex-col">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Ergebnis</p>
        {busy ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
            <p className="text-sm">{busy === "video" ? "Video dauert etwa eine Minute …" : "Wird erzeugt …"}</p>
          </div>
        ) : result ? (
          <>
            <div className="rounded-xl overflow-hidden bg-elevated">
              {result.type === "video" ? (
                <video src={result.url} controls playsInline className="w-full" />
              ) : (
                <Image src={result.url} fittingType="fit" className="w-full" />
              )}
            </div>
            <div className="flex flex-wrap gap-2 mt-4">
              <a href={result.url} target="_blank" rel="noreferrer" download className="px-4 py-2 rounded-full bg-elevated border border-border text-xs font-medium text-foreground">Herunterladen</a>
              {creator && (
                <>
                  <button onClick={saveAsReference} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-elevated border border-border text-xs font-medium text-foreground">
                    <Bookmark className="w-3.5 h-3.5" /> Als Vorlage
                  </button>
                  <button onClick={saveAsContent} className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    Zu den Inhalten
                  </button>
                </>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Noch nichts gebaut.</p>
          </div>
        )}
      </div>
    </div>
  );
}