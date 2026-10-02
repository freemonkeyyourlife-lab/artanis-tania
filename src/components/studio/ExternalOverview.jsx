import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Images, Layers, Cpu, Users, ArrowRight } from "lucide-react";

const CONTENT_LABELS = {
  PHOTO: "Fotos",
  PHOTO_SET: "Fotoserien",
  VIDEO: "Videos",
  TEASER: "Teaser",
  AUDIO: "Audio",
};

const Card = ({ icon: Icon, title, hint, rows, onGoTo, action }) => (
  <div className="rounded-2xl border-2 border-border bg-card p-4">
    <div className="flex items-center gap-2 mb-3">
      <Icon className="w-4 h-4 text-primary" />
      <p className="text-[15px] font-bold text-foreground">{title}</p>
    </div>
    <div className="space-y-1.5">
      {rows.map((r) => (
        <div key={r.label} className="flex items-baseline justify-between gap-3">
          <span className="text-[13px] font-semibold text-muted-foreground">{r.label}</span>
          <span className="text-[15px] font-bold text-foreground">{r.value}</span>
        </div>
      ))}
    </div>
    {hint && <p className="text-[12px] font-semibold text-muted-foreground mt-3">{hint}</p>}
    {onGoTo && (
      <button
        type="button"
        onClick={onGoTo}
        className="mt-3 inline-flex items-center gap-1.5 text-[12px] font-bold text-primary"
      >
        {action || "Öffnen"} <ArrowRight className="w-3.5 h-3.5" />
      </button>
    )}
  </div>
);

// Alles auf einen Blick: was da ist, welche Vorlagen liegen bereit und wie die
// Modelle eingestellt sind — der erste Blick im Externen Studio.
export default function ExternalOverview({ onGoTo }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [byType, creators, kits, blocks, sets, imageModels, textModels, voices, published, favModels] =
          await Promise.all([
            base44.entities.Content.aggregate({ groupBy: "contentType" }),
            base44.entities.Creator.count(),
            base44.entities.BuildKit.count(),
            base44.entities.BuildBlock.count(),
            base44.entities.ModelSet.count(),
            base44.entities.ImageModel.count(),
            base44.entities.TextModel.count(),
            base44.entities.Voice.count(),
            base44.entities.Content.count({ published: true }),
            base44.entities.ImageModel.count({ favorite: true }),
          ]);
        const rows = (byType.rows || []).filter((r) => r.contentType);
        const total = rows.reduce((n, r) => n + (r.count || 0), 0);
        setData({
          rows,
          total,
          published,
          creators,
          kits,
          blocks,
          sets,
          imageModels,
          textModels,
          voices,
          favModels,
        });
      } catch (e) {
        console.error(e);
        setData(false);
      }
    })();
  }, []);

  if (!data) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (data === false) {
    return <p className="text-[14px] font-semibold text-muted-foreground text-center py-16">Übersicht lässt sich gerade nicht laden.</p>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <Card
        icon={Images}
        title="Inhalte"
        rows={[
          { label: "Insgesamt", value: data.total },
          { label: "Veröffentlicht", value: data.published },
          ...data.rows.map((r) => ({ label: CONTENT_LABELS[r.contentType] || r.contentType, value: r.count })),
        ]}
      />
      <Card
        icon={Layers}
        title="Vorlagen"
        rows={[
          { label: "Baukästen", value: data.kits },
          { label: "Bausteine", value: data.blocks },
          { label: "Modell-Kombis", value: data.sets },
          { label: "Stimmen", value: data.voices },
        ]}
        hint="Alles, was du beim Erzeugen wiederverwenden kannst."
      />
      <Card
        icon={Cpu}
        title="Modelle"
        rows={[
          { label: "Bild-Modelle", value: data.imageModels },
          { label: "davon Favoriten", value: data.favModels },
          { label: "Text-Modelle", value: data.textModels },
        ]}
        hint="Freizügigkeit und Stimmung stellst du pro Modell direkt in der Massen-Erzeugung ein."
        onGoTo={onGoTo}
        action="Zur Massen-Erzeugung"
      />
      <Card
        icon={Users}
        title="Charaktere"
        rows={[{ label: "Angelegt", value: data.creators }]}
        hint="Bilder erzeugen, Prompts mitnehmen oder Ergebnisse zurücklegen."
        onGoTo={onGoTo}
        action="Loslegen"
      />
    </div>
  );
}