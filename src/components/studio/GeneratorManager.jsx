import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Sparkles, Loader2, Video, Bookmark, Plus, Check, Trash2, Layers } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { cn } from "@/lib/utils";
import { CARTOON_STYLE, IMAGE_SAFE_RULES, PHOTOREAL } from "@/lib/appearance";
import { uploadDataUrl } from "@/lib/mediaUpload";

// Eigene Bilder und Videos bauen: Person wählen, Prompt drunter, fertig.
// Mehrere Modelle dürfen gleichzeitig ran — und als Kombi abgespeichert werden.
export default function GeneratorManager({ creators }) {
  const [creatorId, setCreatorId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [animated, setAnimated] = useState(false);
  const [extraRefs, setExtraRefs] = useState([]);
  const [models, setModels] = useState([]);
  const [modelKeys, setModelKeys] = useState([]);
  const [kits, setKits] = useState([]);
  const [kitName, setKitName] = useState("");
  const [busy, setBusy] = useState(null);
  const [results, setResults] = useState([]);
  const { toast } = useToast();

  const loadKits = async () => {
    const r = await base44.entities.ModelSet.list("-created_date", 50).catch(() => []);
    setKits(Array.isArray(r) ? r : r.items || []);
  };

  // Zusätzliche Modelle, die im Studio unter "Modelle" freigeschaltet sind.
  useEffect(() => {
    base44.entities.ImageModel.filter({ enabled: true }, "created_date", 100)
      .then((res) => {
        const items = Array.isArray(res) ? res : res?.items || [];
        // Favoriten zuerst — die guten Modelle stehen gleich oben.
        setModels([...items].sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0)));
      })
      .catch(() => setModels([]));
    loadKits();
  }, []);

  const creator = creators.find((c) => c.id === creatorId);
  const refs = [creator?.avatar, ...(creator?.referenceImages || []), ...extraRefs]
    .filter(Boolean)
    .filter((v, i, a) => a.indexOf(v) === i)
    .slice(0, 6);

  // Ohne Auswahl läuft der Standard-Generator, sonst jedes gewählte Modell.
  const targets = () => (modelKeys.length ? models.filter((m) => modelKeys.includes(m.id)) : [null]);

  const buildPrompt = () => {
    const style = animated ? CARTOON_STYLE : PHOTOREAL;
    let p = style + IMAGE_SAFE_RULES + " ";
    if (creator) {
      p += `The woman in the reference images is ${creator.stageName}. Keep her face, hair colour, hair length, body and skin tone EXACTLY as in her reference images — she must be recognisable. `;
    }
    p += prompt;
    return p;
  };

  const generateImages = async () => {
    if (!prompt.trim()) return;
    setBusy("image");
    setResults([]);
    const list = targets();
    const out = await Promise.all(
      list.map(async (m) => {
        const label = m?.name || "Standard-Generator";
        try {
          if (m) {
            const res = await base44.functions.invoke("hfGenerate", {
              modelId: m.modelId,
              source: m.source,
              prompt: buildPrompt(),
            });
            if (res.data?.error) throw new Error(res.data.error);
            return { key: m.id, label, type: "image", url: res.data.imageUrl };
          }
          const res = await base44.integrations.Core.GenerateImage({
            prompt: buildPrompt(),
            existing_image_urls: refs.length ? refs : undefined,
          });
          return { key: "default", label, type: "image", url: res.url };
        } catch (e) {
          return { key: m?.id || "default", label, type: "image", error: e.message || "Hat nicht geklappt" };
        }
      })
    );
    setResults(out);
    setBusy(null);
    if (out.length && out.every((r) => r.error)) {
      toast({
        title: "Kein Modell hat geantwortet",
        description: "Versuch es mit einem anderen Modell oder Prompt nochmal.",
        variant: "destructive",
      });
    }
  };

  const generateVideo = async () => {
    if (!prompt.trim()) return;
    setBusy("video");
    setResults([]);
    try {
      const res = await base44.integrations.Core.GenerateVideo({
        prompt: (creator ? `The woman looks exactly like ${creator.stageName}. ` : "") + prompt,
        duration: 6,
        aspect_ratio: "9:16",
      });
      setResults([{ key: "video", label: "Video", type: "video", url: res.url }]);
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

  const toggleModel = (id) =>
    setModelKeys((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const saveKit = async () => {
    const name = kitName.trim();
    if (!name || !modelKeys.length) return;
    await base44.entities.ModelSet.create({ name, modelIds: modelKeys });
    setKitName("");
    await loadKits();
    toast({ title: "Kombi gespeichert", description: `„${name}" startet künftig alle gewählten Modelle auf einmal.` });
  };

  const removeKit = async (k) => {
    await base44.entities.ModelSet.delete(k.id);
    setKits((prev) => prev.filter((x) => x.id !== k.id));
  };

  const saveAsReference = async (r) => {
    if (!creator || r.type !== "image") return;
    const url = await uploadDataUrl(r.url, `${creator.stageName}.png`);
    await base44.entities.Creator.update(creator.id, {
      referenceImages: [...(creator.referenceImages || []), url].filter((v, i, a) => a.indexOf(v) === i),
    });
    toast({ title: "Gemerkt", description: `${creator.stageName} sieht ab jetzt so aus.` });
  };

  const saveAsContent = async (r) => {
    if (!creator || r.error) return;
    const url = await uploadDataUrl(r.url, `${creator.stageName}-${Date.now()}.png`);
    await base44.entities.Content.create({
      creatorId: creator.id,
      creatorName: creator.stageName,
      title: prompt.slice(0, 60) || creator.stageName,
      contentType: r.type === "video" ? "VIDEO" : "PHOTO",
      thumbnail: r.type === "video" ? null : url,
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

        <label className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
          Quellen · {modelKeys.length ? `${modelKeys.length} gewählt` : "Standard-Generator"}
        </label>
        <div className="max-h-44 overflow-y-auto rounded-xl border border-border bg-background p-1.5 mb-2 space-y-1">
          <button
            onClick={() => setModelKeys([])}
            className={cn(
              "w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors",
              !modelKeys.length ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            Standard-Generator
          </button>
          {models.map((m) => {
            const on = modelKeys.includes(m.id);
            return (
              <button
                key={m.id}
                onClick={() => toggleModel(m.id)}
                className={cn(
                  "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold transition-colors",
                  on ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span className={cn("w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0", on ? "bg-primary border-primary text-primary-foreground" : "border-border")}>
                  {on && <Check className="w-3 h-3" />}
                </span>
                <span className="truncate">{m.name}</span>
              </button>
            );
          })}
        </div>
        <p className="text-[11px] text-muted-foreground mb-4">
          Mehrere wählen — alle laufen gleichzeitig, du siehst die Ergebnisse nebeneinander.
        </p>

        {kits.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {kits.map((k) => (
              <span key={k.id} className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 rounded-full glass-btn text-[12px] font-bold text-foreground">
                <button onClick={() => setModelKeys(k.modelIds || [])} title="Diese Kombi laden" className="inline-flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-primary" /> {k.name}
                </button>
                <button
                  onClick={() => removeKit(k)}
                  title="Kombi löschen"
                  className="w-6 h-6 rounded-full bg-destructive/15 text-destructive flex items-center justify-center"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {modelKeys.length > 0 && (
          <div className="flex gap-2 mb-4">
            <input
              value={kitName}
              onChange={(e) => setKitName(e.target.value)}
              placeholder="Name für die Kombi, z. B. Mein Bild-Set"
              className="flex-1 px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground"
            />
            <button
              onClick={saveKit}
              disabled={!kitName.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full bg-elevated border border-border text-xs font-semibold text-foreground disabled:opacity-50 whitespace-nowrap"
            >
              <Layers className="w-3.5 h-3.5" /> Als Kombi speichern
            </button>
          </div>
        )}

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
              <Image src={url} fittingType="fill" className="w-20 h-20 rounded-2xl" />
              <button onClick={() => setExtraRefs((prev) => prev.filter((u) => u !== url))} className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-white text-[10px] leading-none">×</button>
            </div>
          ))}
        </div>

        {refs.length > 0 && (
          <div className="flex gap-2 flex-wrap mb-5">
            {refs.map((r) => (
              <Image key={r} src={r} fittingType="fill" className="w-20 h-20 rounded-2xl" />
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={generateImages}
            disabled={!prompt.trim() || !!busy}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
          >
            {busy === "image" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {modelKeys.length > 1 ? `Bild × ${modelKeys.length}` : "Bild"}
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
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Ergebnis{results.length > 1 ? ` · ${results.length}` : ""}
        </p>
        {busy ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 text-muted-foreground py-16">
            <Loader2 className="w-7 h-7 animate-spin text-primary" />
            <p className="text-sm">
              {busy === "video"
                ? "Video dauert etwa eine Minute …"
                : targets().length > 1
                  ? `${targets().length} Modelle arbeiten gleichzeitig …`
                  : "Wird erzeugt …"}
            </p>
          </div>
        ) : results.length ? (
          <div className="grid sm:grid-cols-2 gap-4">
            {results.map((r) => (
              <div key={r.key} className="rounded-xl border border-border bg-elevated p-3">
                <p className="text-[12px] font-bold text-foreground truncate mb-2">{r.label}</p>
                {r.error ? (
                  <p className="text-[12px] text-destructive">{r.error}</p>
                ) : (
                  <>
                    <div className="rounded-lg overflow-hidden bg-background">
                      {r.type === "video" ? (
                        <video src={r.url} controls playsInline className="w-full" />
                      ) : (
                        <Image src={r.url} fittingType="fit" className="w-full" />
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      <a href={r.url} target="_blank" rel="noreferrer" download className="px-3 py-1.5 rounded-full bg-background border border-border text-[11px] font-medium text-foreground">Herunterladen</a>
                      {creator && r.type === "image" && (
                        <button onClick={() => saveAsReference(r)} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background border border-border text-[11px] font-medium text-foreground">
                          <Bookmark className="w-3 h-3" /> Als Vorlage
                        </button>
                      )}
                      {creator && (
                        <button onClick={() => saveAsContent(r)} className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-[11px] font-semibold">
                          Zu den Inhalten
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">Noch nichts gebaut.</p>
          </div>
        )}
      </div>
    </div>
  );
}