import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Check, Loader2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { composeImagePrompt } from "@/lib/composeImagePrompt";
import { emptyDirection } from "@/lib/imageDirection";
import { generateWithModel } from "@/lib/imageGen";
import { uploadDataUrl } from "@/lib/mediaUpload";
import ImageDirectionPanel from "@/components/studio/ImageDirectionPanel";
import FinalPromptPreview from "@/components/studio/FinalPromptPreview";
import NarratorModelPicker from "@/components/narrator/NarratorModelPicker";
import NarratorRefStrip from "@/components/narrator/NarratorRefStrip";
import NarratorGallery from "@/components/narrator/NarratorGallery";
import NarratorImageResult from "@/components/narrator/NarratorImageResult";
import VoiceTextArea from "@/components/voice/SpeakField";
import PromptRefiner from "@/components/studio/PromptRefiner";
import { characterFromNarrator } from "@/lib/promptSharpen";
import { presetFor } from "@/lib/modelPrompts";
import { labelCls, chipCls, btnCls, btnAccentCls } from "@/lib/narratorUi";

const rows = (res) => (Array.isArray(res) ? res : res?.items || []);
const unique = (list) => list.filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);

// Foto-Kreation wie im Studio: Modell wählen, Prompt schreiben, Vorlagebild
// nehmen und daraus umbauen. Dieselbe Maschine, derselbe Prompt — kein Nebenweg.
export default function NarratorImageBlock({ narrator, onSaved }) {
  const { toast } = useToast();
  const [models, setModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(true);
  const [modelKeys, setModelKeys] = useState([]);
  const [appearance, setAppearance] = useState(narrator?.appearance || "");
  const [prompt, setPrompt] = useState("");
  const [animated, setAnimated] = useState(narrator?.artStyle === "CARTOON");
  const [direction, setDirection] = useState(emptyDirection());
  const [refs, setRefs] = useState(narrator?.referenceImages || []);
  const [gallery, setGallery] = useState(narrator?.gallery || []);
  const [face, setFace] = useState(narrator?.avatar || "");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [results, setResults] = useState([]);

  // Alle Bildmodelle, die im Studio freigeschaltet sind — Favoriten oben.
  useEffect(() => {
    base44.entities.ImageModel.filter({ enabled: true }, { sort: "-created_date", limit: 200 })
      .then((res) => {
        const items = rows(res);
        setModels([...items].sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0)));
      })
      .catch(() => setModels([]))
      .finally(() => setLoadingModels(false));
  }, []);

  const allRefs = () => unique([face, ...refs]).slice(0, 6);

  const buildPrompt = () => {
    const scene = [appearance.trim() ? `Her look: ${appearance.trim()}.` : "", prompt.trim()]
      .filter(Boolean)
      .join(" ");
    return composeImagePrompt({
      animated,
      name: narrator?.name?.trim(),
      subject: narrator?.gender === "MAENNLICH" ? "man" : "woman",
      withRefs: allRefs().length > 0,
      prompt: scene,
      direction,
    });
  };

  const targets = () => (modelKeys.length ? models.filter((m) => modelKeys.includes(m.id)) : [null]);

  // Ist genau ein Modell gewählt, schreibt der Feinschliff in dessen Sprache.
  const oneModel = modelKeys.length === 1 ? models.find((m) => m.id === modelKeys[0]) : null;

  const generate = async () => {
    if (!prompt.trim() && !appearance.trim()) return;
    setBusy(true);
    setResults([]);
    const refList = allRefs();
    const out = await Promise.all(
      targets().map(async (m) => {
        const label = m?.name || "Standard-Generator";
        try {
          if (m) {
            const url = await generateWithModel(m, buildPrompt(), "portrait", refList[0]);
            return { key: m.id, label, url };
          }
          const res = await base44.integrations.Core.GenerateImage({
            prompt: buildPrompt(),
            existing_image_urls: refList.length ? refList : undefined,
          });
          return { key: "standard", label, url: res.url };
        } catch (e) {
          return { key: m?.id || "standard", label, error: e.message || "Hat nicht geklappt" };
        }
      })
    );
    setResults(out);
    setBusy(false);
    if (out.length && out.every((r) => r.error)) {
      toast({
        title: "Kein Modell hat geantwortet",
        description: "Anderes Modell oder anderen Prompt versuchen.",
        variant: "destructive",
      });
    }
  };

  const keep = async (patch, message) => {
    const rec = await base44.entities.Narrator.update(narrator.id, patch);
    onSaved?.(rec);
    toast({ title: message });
  };

  const saveFace = async (url) => {
    const stored = await uploadDataUrl(url, `${narrator?.name || "figur"}-bild.png`);
    setFace(stored);
    setGallery((g) => unique([stored, ...g]));
    await keep({ avatar: stored, gallery: unique([stored, ...gallery]).slice(0, 24) }, "Das ist jetzt ihr Bild");
  };

  const saveGallery = async (url) => {
    const stored = await uploadDataUrl(url, `${narrator?.name || "figur"}-${Date.now()}.png`);
    setGallery((g) => unique([stored, ...g]));
    await keep({ gallery: unique([stored, ...gallery]).slice(0, 24) }, "Liegt in ihrer Sammlung");
  };

  const saveRef = async (url) => {
    const stored = await uploadDataUrl(url, `${narrator?.name || "figur"}-vorlage.png`);
    const next = unique([stored, ...refs]);
    setRefs(next);
    await keep({ referenceImages: next }, "Als Vorlage gemerkt");
  };

  const uploadRefs = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      const urls = [];
      for (const file of files) {
        const res = await base44.integrations.Core.UploadPublicFile({ file });
        urls.push(res.file_url);
      }
      const next = unique([...urls, ...refs]).slice(0, 8);
      setRefs(next);
      await keep({ referenceImages: next }, "Vorlage dazu");
    } catch (err) {
      toast({ title: "Upload fehlgeschlagen", variant: "destructive" });
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const removeRef = async (url) => {
    const next = refs.filter((u) => u !== url);
    setRefs(next);
    await keep({ referenceImages: next }, "Vorlage entfernt");
  };

  const saveGalleryOrder = async (next) => {
    setGallery(next);
    await keep({ gallery: next }, "Reihenfolge gespeichert");
  };

  const removeGalleryImage = async (url) => {
    const next = gallery.filter((u) => u !== url);
    setGallery(next);
    const patch = { gallery: next };
    if (face === url) { setFace(""); patch.avatar = ""; }
    await keep(patch, "Bild entfernt");
  };

  const clearFace = async () => {
    setFace("");
    await keep({ avatar: "" }, "Gesichtsbild entfernt");
  };

  const saveLook = async () => {
    setSaving(true);
    try {
      await keep({ appearance, artStyle: animated ? "CARTOON" : "PHOTOREAL" }, "Gespeichert");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="space-y-5">
          <NarratorModelPicker
            models={models}
            loading={loadingModels}
            selected={modelKeys}
            onToggle={(id) => setModelKeys((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}
            onClear={() => setModelKeys([])}
          />
          <NarratorRefStrip
            face={face}
            refs={refs}
            onUpload={uploadRefs}
            onRemove={removeRef}
            onClearFace={clearFace}
            uploading={uploading}
          />
        </div>

        <div className="space-y-4">
          <div>
            <label className={labelCls}>Wie sie aussieht</label>
            <VoiceTextArea
              value={appearance}
              onChange={setAppearance}
              rows={3}
              placeholder="Haare, Augen, Figur, was sie trägt — damit sie auch so gezeichnet wird."
            />
          </div>

          <div>
            <label className={labelCls}>Prompt</label>
            <VoiceTextArea
              value={prompt}
              onChange={setPrompt}
              rows={5}
              placeholder="Was soll zu sehen sein? Pose, Perspektive, Ort, Outfit, Licht …"
            />
            <div className="mt-2">
              <PromptRefiner
                value={prompt}
                onChange={setPrompt}
                target="BILD"
                style={animated ? "ANIMIERT" : "FOTO"}
                character={characterFromNarrator(narrator)}
                preset={oneModel ? presetFor(oneModel) : null}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button onClick={() => setAnimated(false)} className={chipCls(!animated)}>
              Fotoreal
            </button>
            <button onClick={() => setAnimated(true)} className={chipCls(animated)}>
              Gezeichnet
            </button>
            <button onClick={saveLook} disabled={saving} className={cn(btnCls, "ml-auto")}>
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />} Aussehen speichern
            </button>
          </div>

          <ImageDirectionPanel value={direction} onChange={setDirection} title="Regie: Stil, Inhalt, Stimmung, Freizügigkeit, Klamotte" />
          <FinalPromptPreview text={buildPrompt()} />

          {/* Der Knopf bleibt beim Scrollen unten stehen — man kann ihn nicht übersehen. */}
          <div className="sticky bottom-4 z-20 pt-1">
            <button
              onClick={generate}
              disabled={busy || (!prompt.trim() && !appearance.trim())}
              className={cn(btnAccentCls, "w-full justify-center py-3.5 text-[15px] shadow-2xl")}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {busy
                ? "Wird erzeugt …"
                : modelKeys.length > 1
                  ? `Bild erzeugen × ${modelKeys.length} Modelle`
                  : "Bild erzeugen"}
            </button>
            {!busy && !prompt.trim() && !appearance.trim() && (
              <p className="mt-2 text-center text-[12px] font-semibold text-muted-foreground">
                Erst „Wie sie aussieht" oder den Prompt ausfüllen — dann wird der Knopf aktiv.
              </p>
            )}
          </div>
        </div>
      </div>

      {busy && (
        <div className="flex flex-col items-center justify-center gap-3 py-10 text-muted-foreground">
          <Loader2 className="w-7 h-7 animate-spin text-primary" />
          <p className="text-[14px] font-semibold">
            {targets().length > 1 ? `${targets().length} Modelle arbeiten gleichzeitig …` : "Wird erzeugt …"}
          </p>
        </div>
      )}

      {!busy && results.length > 0 && (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-5">
          {results.map((r) => (
            <NarratorImageResult
              key={r.key}
              item={r}
              onAvatar={saveFace}
              onGallery={saveGallery}
              onRef={saveRef}
            />
          ))}
        </div>
      )}

      {gallery.length > 0 && (
        <NarratorGallery
          gallery={gallery}
          face={face}
          onFace={saveFace}
          onReorder={saveGalleryOrder}
          onRemove={removeGalleryImage}
          onClearFace={clearFace}
        />
      )}
    </div>
  );
}