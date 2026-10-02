import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image } from "@/components/ui/image";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { addGalleryItems } from "@/lib/gallery";
import { generateWithModel } from "@/lib/imageGen";
import { characterPrompt } from "@/lib/externalPrompt";
import { directionPrompt, emptyDirection, modelsForLevel } from "@/lib/imageDirection";
import ImageDirectionPanel from "@/components/studio/ImageDirectionPanel";
import MassCharacterPicker from "@/components/studio/MassCharacterPicker";
import MassModelPicker from "@/components/studio/MassModelPicker";
import MassJobPlan from "@/components/studio/MassJobPlan";

const FIELDS = ["stageName", "avatar", "banner", "referenceImages", "personaType", "artStyle", "age", "tagline", "shortStory", "bio"];
const MAX_JOBS = 12;

// Viele Charaktere auf einmal: Regler stellen, Modelle wählen, jede Kombination
// vor dem Start feinjustieren — dann laufen lassen. Jedes Bild landet sofort in
// der Galerie und wird Hauptbild, wenn noch keins da ist.
export default function MassGeneration({ onChanged }) {
  const { toast } = useToast();
  const [creators, setCreators] = useState([]);
  const [models, setModels] = useState([]);
  const [dir, setDir] = useState(emptyDirection());
  const [picked, setPicked] = useState([]);
  const [modelIds, setModelIds] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState([]);

  useEffect(() => {
    base44.entities.Creator.filter({}, { sort: "stageName", limit: 300, fields: FIELDS })
      .then((p) => setCreators(p.items || []))
      .catch(() => setCreators([]));
    base44.entities.ImageModel.filter({ enabled: true }, { sort: "-created_date", limit: 100 })
      .then((p) => setModels(p.items || []))
      .catch(() => setModels([]));
  }, []);

  const offered = useMemo(() => modelsForLevel(models, dir.freizuegigkeit), [models, dir.freizuegigkeit]);

  const toggleCreator = (id) => setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleModel = (id) => setModelIds((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  // Die Stufe hängt am Modell: einmal gesetzt, gilt sie auch im Generator.
  const setModelLevel = async (m, level) => {
    const value = m.explicit === level ? "" : level;
    setModels((prev) => prev.map((x) => (x.id === m.id ? { ...x, explicit: value } : x)));
    await base44.entities.ImageModel.update(m.id, { explicit: value });
  };

  // Der ganze Plan steht, bevor etwas läuft — inklusive Stufe pro Kombination.
  const jobs = useMemo(() => {
    const targets = picked.map((id) => creators.find((c) => c.id === id)).filter(Boolean);
    const sources = modelIds.length ? models.filter((m) => modelIds.includes(m.id)) : [null];
    const list = [];
    targets.forEach((c) => sources.forEach((m) => list.push({ creator: c, model: m })));
    return list.slice(0, MAX_JOBS).map(({ creator, model }) => {
      const key = `${creator.id}|${model?.id || "default"}`;
      return {
        key,
        creator,
        model,
        creatorName: creator.stageName,
        modelName: model?.name || "Standard-Generator",
        level: overrides[key] ?? (model?.explicit || dir.freizuegigkeit || ""),
      };
    });
  }, [picked, modelIds, creators, models, dir.freizuegigkeit, overrides]);

  const setJobLevel = (key, level) => setOverrides((p) => ({ ...p, [key]: level }));

  const run = async () => {
    if (!jobs.length) return;

    setBusy(true);
    setResults([]);
    setProgress({ done: 0, total: jobs.length });

    const out = [];
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];
      const prompt = [characterPrompt(job.creator), directionPrompt({ ...dir, freizuegigkeit: job.level })]
        .filter(Boolean)
        .join(" ");
      try {
        const url = job.model
          ? await generateWithModel(job.model, prompt)
          : (
              await base44.integrations.Core.GenerateImage({
                prompt,
                existing_image_urls: job.creator.referenceImages?.length ? job.creator.referenceImages : undefined,
              })
            ).url;
        out.push({ creatorId: job.creator.id, creatorName: job.creatorName, modelName: job.modelName, url });
        setResults([...out]);
        await addGalleryItems({ urls: [url], creatorId: job.creator.id, creatorName: job.creatorName });
        if (!job.creator.avatar) {
          await base44.entities.Creator.update(job.creator.id, { avatar: url, banner: job.creator.banner || url });
        }
      } catch (e) {
        out.push({ creatorId: job.creator.id, creatorName: job.creatorName, modelName: job.modelName, error: e.message || "Hat nicht geklappt" });
        setResults([...out]);
      }
      setProgress({ done: i + 1, total: jobs.length });
    }

    setBusy(false);
    onChanged?.();
    const ok = out.filter((r) => !r.error).length;
    toast({
      title: ok ? `${ok} Bild(er) fertig` : "Kein Modell hat geantwortet",
      description: ok ? "Liegen in der Galerie der Charaktere." : "Versuch ein anderes Modell oder einen kürzeren Prompt.",
      variant: ok ? undefined : "destructive",
    });
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <div className="space-y-4">
        <MassCharacterPicker
          creators={creators}
          picked={picked}
          query={query}
          onQuery={setQuery}
          onToggle={toggleCreator}
          onAll={setPicked}
        />
        <ImageDirectionPanel
          value={dir}
          onChange={setDir}
          title="Regie: Stimmung, Stil, Freizügigkeit"
        />
        <MassModelPicker models={offered} modelIds={modelIds} onToggle={toggleModel} onLevel={setModelLevel} />
        <MassJobPlan jobs={jobs} onLevel={setJobLevel} busy={busy} />

        <div className="rounded-2xl border-2 border-border bg-card p-4">
          <button
            type="button"
            onClick={run}
            disabled={busy || !jobs.length}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground text-[15px] font-bold disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {jobs.length ? `${jobs.length} Bild(er) erzeugen` : "Erst Charaktere wählen"}
          </button>
          <p className="text-[12px] font-semibold text-muted-foreground mt-2">
            {jobs.length} Kombinationen vorbereitet
            {picked.length * (modelIds.length || 1) > MAX_JOBS ? ` — es laufen die ersten ${MAX_JOBS}.` : "."}
          </p>
          {busy && (
            <div className="mt-3">
              <div className="h-2.5 rounded-full bg-elevated border border-border overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${Math.round((progress.done / progress.total) * 100)}%` }}
                />
              </div>
              <p className="text-[12px] font-bold text-muted-foreground mt-1.5">
                {progress.done} von {progress.total}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border-2 border-border bg-card p-4">
        <p className="text-[15px] font-bold text-foreground mb-3 flex items-center gap-2">
          <Wand2 className="w-4 h-4 text-primary" /> Ergebnis{results.length ? ` · ${results.length}` : ""}
        </p>
        {!results.length ? (
          <p className="text-[14px] font-semibold text-muted-foreground text-center py-16">
            {busy ? "Läuft … die ersten Bilder kommen gleich." : "Noch nichts erzeugt."}
          </p>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {results.map((r, i) => (
              <div key={`${r.creatorId}-${i}`} className="rounded-xl border border-border bg-background p-2.5">
                <p className="text-[13px] font-bold text-foreground truncate">{r.creatorName}</p>
                <p className="text-[11px] font-semibold text-muted-foreground truncate mb-2">{r.modelName}</p>
                {r.error ? (
                  <p className="text-[12px] font-semibold text-destructive">{r.error}</p>
                ) : (
                  <Image src={r.url} fittingType="fill" className="w-full aspect-[3/4] rounded-lg" />
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}