import React, { useEffect, useState } from "react";
import { LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import ExternalOverview from "@/components/studio/ExternalOverview";
import MassGeneration from "@/components/studio/MassGeneration";
import ExternalPromptUpload from "@/components/studio/ExternalPromptUpload";
import ExternalStudioEditor from "@/components/studio/ExternalStudioEditor";
import { loadLayout, saveLayout } from "@/lib/siteLayout";
import { defaultStudioLayout, normalizeStudioLayout } from "@/lib/studioLayout";

// Der zentrale Arbeitsplatz: erst sehen, was da ist, dann in Serie erzeugen,
// dann Prompts mitnehmen und Ergebnisse zurücklegen. Die Anordnung ist frei.
export default function ExternalStudio({ onChanged }) {
  const [record, setRecord] = useState(null);
  const [layout, setLayout] = useState(defaultStudioLayout());
  const [section, setSection] = useState("overview");
  const [editing, setEditing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadLayout().then((row) => {
      const l = normalizeStudioLayout(row?.studioLayout);
      setRecord(row);
      setLayout(l);
      setSection(l.start);
    });
  }, []);

  const save = async (draft) => {
    const next = normalizeStudioLayout(draft);
    const saved = await saveLayout(record, { studioLayout: next });
    setRecord(saved || record);
    setLayout(next);
    if (!next.sections.some((s) => s.id === section && !s.hidden)) setSection(next.start);
    setEditing(false);
    toast({ title: "Anordnung gespeichert" });
  };

  const visible = layout.sections.filter((s) => !s.hidden);
  const side = layout.nav === "side";
  const goTo = (id) => visible.some((s) => s.id === id) && setSection(id);

  const menu = (
    <div className={cn("flex gap-2", side ? "flex-col lg:w-56 flex-shrink-0" : "flex-wrap mb-5")}>
      {visible.map((s) => (
        <button
          key={s.id}
          onClick={() => setSection(s.id)}
          className={cn(
            "px-5 py-2.5 rounded-full text-[14px] font-bold transition-colors",
            side && "text-left",
            section === s.id ? "glass-btn glass-btn-accent text-gloss" : "glass-btn text-muted-foreground"
          )}
        >
          {s.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="glass rounded-2xl border-2 border-border p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
        <div>
          <p className="font-display text-2xl text-foreground mb-1">Externes Studio</p>
          <p className="text-[15px] font-semibold text-muted-foreground max-w-3xl">
            Dein Arbeitsplatz für Bilder: Inhalte, Vorlagen und Modell-Einstellungen auf einen Blick, Charaktere in Serie
            erzeugen und fertige Ergebnisse zurücklegen.
          </p>
        </div>
        <button
          onClick={() => setEditing((v) => !v)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-btn ring-2 ring-yellow-400 text-[13px] font-bold text-foreground"
        >
          <LayoutGrid className="w-4 h-4" /> {editing ? "Editor schließen" : "Anordnen"}
        </button>
      </div>

      {editing && <ExternalStudioEditor value={layout} onSave={save} onCancel={() => setEditing(false)} />}

      <div className={cn(side && "flex flex-col lg:flex-row gap-6")}>
        {menu}
        <div className="flex-1 min-w-0">
          {section === "overview" && <ExternalOverview onGoTo={() => goTo("mass")} />}
          {section === "mass" && <MassGeneration onChanged={onChanged} />}
          {section === "prompt" && <ExternalPromptUpload onChanged={onChanged} />}
        </div>
      </div>
    </div>
  );
}