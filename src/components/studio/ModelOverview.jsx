import React, { useEffect, useMemo, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Image as ImageIcon, Type, Power, Loader2, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { modelStrength, modelCapabilities, capabilityLabel, capabilityCount } from "@/lib/modelStrengths";
import ModelStrengthNote from "@/components/studio/ModelStrengthNote";
import ModelCapabilityBar from "@/components/studio/ModelCapabilityBar";

const SOURCE_LABELS = {
  HUGGING_FACE: "Hugging Face",
  POLLINATIONS: "Pollinations (frei)",
};

function ModelRow({ model, onToggle, showCapabilities }) {
  return (
    <div className={cn("flex items-center gap-3 p-3 rounded-xl bg-elevated border border-border", !model.enabled && "opacity-60")}>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">{model.name}</p>
        <p className="text-[11px] text-muted-foreground truncate">{model.modelId}</p>
        {model.note && <p className="text-[11px] text-muted-foreground truncate">{model.note}</p>}
        <ModelStrengthNote chips={modelStrength(model).chips} hint={modelStrength(model).hint} />
        {showCapabilities && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {modelCapabilities(model).map((id) => (
              <span
                key={id}
                className="px-2 py-0.5 rounded-full border border-border bg-background text-[10px] font-bold text-muted-foreground"
              >
                {capabilityLabel(id)}
              </span>
            ))}
          </div>
        )}
      </div>
      <button
        onClick={() => onToggle(model)}
        title={model.enabled ? "Ausschalten" : "Einschalten"}
        className={cn(
          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-colors",
          model.enabled ? "bg-emerald-600/20 text-emerald-400" : "bg-background border border-border text-muted-foreground"
        )}
      >
        <Power className="w-3 h-3" /> {model.enabled ? "An" : "Aus"}
      </button>
    </div>
  );
}

// Alle eingetragenen Modelle an einem Ort — erst Bilder, dann Text, jeweils nach
// Plattform sortiert. Umschalten direkt hier, verwalten im jeweiligen Bereich.
export default function ModelOverview({ onOpenTab }) {
  const [images, setImages] = useState([]);
  const [texts, setTexts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [caps, setCaps] = useState([]);
  const [sort, setSort] = useState("default");

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [img, txt] = await Promise.all([
        base44.entities.ImageModel.list("-created_date", 200),
        base44.entities.TextModel.list("-created_date", 200),
      ]);
      setImages(img);
      setTexts(txt);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggleImage = async (m) => {
    await base44.entities.ImageModel.update(m.id, { enabled: !m.enabled });
    setImages((prev) => prev.map((x) => (x.id === m.id ? { ...x, enabled: !x.enabled } : x)));
  };

  const toggleText = async (m) => {
    await base44.entities.TextModel.update(m.id, { enabled: !m.enabled });
    setTexts((prev) => prev.map((x) => (x.id === m.id ? { ...x, enabled: !x.enabled } : x)));
  };

  const imageGroups = useMemo(() => {
    const shown = images
      .filter((m) => !caps.length || caps.every((c) => modelCapabilities(m).includes(c)))
      .sort((a, b) =>
        sort === "vielfalt" ? capabilityCount(b) - capabilityCount(a) || Number(b.enabled) - Number(a.enabled) : 0
      );
    const out = [];
    for (const key of ["HUGGING_FACE", "POLLINATIONS"]) {
      const rows = shown.filter((m) => (m.source || "HUGGING_FACE") === key);
      if (rows.length) out.push({ key, label: SOURCE_LABELS[key], rows });
    }
    const other = shown.filter((m) => !["HUGGING_FACE", "POLLINATIONS"].includes(m.source || "HUGGING_FACE"));
    if (other.length) out.push({ key: "ANDERE", label: "Weitere", rows: other });
    return out;
  }, [images, caps, sort]);

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  const activeImages = images.filter((m) => m.enabled).length;
  const activeTexts = texts.filter((m) => m.enabled).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <ImageIcon className="w-4 h-4 text-primary" />
          <h2 className="font-display text-xl text-foreground">Bild-KI</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          {activeImages} von {images.length} an — nach Plattform sortiert.
        </p>

        <ModelCapabilityBar models={images} value={caps} onChange={setCaps} sort={sort} onSort={setSort} />

        <div className="space-y-5">
          {imageGroups.map((g) => (
            <div key={g.key}>
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2">
                {g.label} · {g.rows.length}
              </p>
              <div className="space-y-2">
                {g.rows.map((m) => <ModelRow key={m.id} model={m} onToggle={toggleImage} showCapabilities />)}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => onOpenTab("models")}
          className="inline-flex items-center gap-1.5 mt-5 text-xs font-semibold text-primary hover:underline"
        >
          Bild-KI verwalten <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 mb-1">
          <Type className="w-4 h-4 text-primary" />
          <h2 className="font-display text-xl text-foreground">Text-KI</h2>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          {activeTexts} von {texts.length} an — die Modelle für Chat und Rollenspiel.
        </p>

        <div className="space-y-2">
          {texts.map((m) => <ModelRow key={m.id} model={m} onToggle={toggleText} />)}
        </div>

        <button
          onClick={() => onOpenTab("textmodels")}
          className="inline-flex items-center gap-1.5 mt-5 text-xs font-semibold text-primary hover:underline"
        >
          Text-KI verwalten <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}