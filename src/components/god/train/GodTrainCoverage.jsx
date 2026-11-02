import React from "react";
import { Image as ImageIcon, Film, Mic, FileText, User, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

// Was pro Charakter verfügbar ist — und was für ein Trainingsset noch fehlt.
// So sieht man je Genre auf einen Blick, statt jede Datei einzeln zu zählen.
const TARGET_IMAGES = 12;

const KIND_META = [
  { key: "BILD", label: "Bilder", icon: ImageIcon },
  { key: "VIDEO", label: "Videos", icon: Film },
  { key: "AUDIO", label: "Audio", icon: Mic },
  { key: "STIMME", label: "Stimme", icon: Mic },
  { key: "TEXT", label: "Texte", icon: FileText },
  { key: "STORY", label: "Storys", icon: FileText },
];

export default function GodTrainCoverage({ items, characters, onSelectChar }) {
  // Pro Charakter: zähle je Genre, was vorliegt.
  const rows = characters.map((c) => {
    const own = items.filter((q) => q.characterId === c.id);
    const counts = {};
    own.forEach((q) => { counts[q.kind] = (counts[q.kind] || 0) + 1; });
    return { char: c, counts, total: own.length };
  });
  const ohne = items.filter((q) => !q.characterId);
  const ohneCounts = {};
  ohne.forEach((q) => { ohneCounts[q.kind] = (ohneCounts[q.kind] || 0) + 1; });

  // Ein Vorschlag pro Charakter — was fürs Training am dringendsten fehlt.
  const suggest = (counts) => {
    const imgs = counts.BILD || 0;
    const voice = (counts.AUDIO || 0) + (counts.STIMME || 0);
    if (imgs < TARGET_IMAGES) return { t: `Bilder sammeln — ${imgs}/${TARGET_IMAGES}`, tone: "warn" };
    if (!voice) return { t: "Stimme fehlt — Audio oder Sprachprobe laden", tone: "warn" };
    if (!counts.VIDEO) return { t: "Video-Referenz fehlt", tone: "soft" };
    if (!counts.TEXT && !counts.STORY) return { t: "Story/Beschreibung fehlt", tone: "soft" };
    return { t: "Bereit fürs Training", tone: "ok" };
  };

  const toneClass = (tone) => ({
    warn: "text-primary",
    soft: "text-muted-foreground",
    ok: "text-emerald-400",
  }[tone] || "text-muted-foreground");

  const renderRow = (label, counts, total, onClick) => (
    <button
      key={label}
      onClick={onClick}
      className="w-full text-left rounded-xl border border-border bg-elevated p-2 hover:border-primary/40 transition-colors"
    >
      <div className="flex items-center gap-1.5 mb-1.5">
        <User className="w-3.5 h-3.5 text-primary" />
        <p className="text-[12px] font-bold text-foreground truncate">{label}</p>
        <span className="ml-auto text-[11px] font-bold text-muted-foreground">{total}</span>
      </div>
      <div className="flex flex-wrap gap-1 mb-1.5">
        {KIND_META.map((k) => (
          <span
            key={k.key}
            className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
              counts[k.key] ? "bg-background border border-border text-foreground" : "bg-background/40 border border-border/50 text-muted-foreground/50"
            )}
          >
            <k.icon className="w-2.5 h-2.5" /> {counts[k.key] || 0}
          </span>
        ))}
      </div>
      <p className={cn("flex items-center gap-1 text-[10px] font-bold", toneClass(suggest(counts).tone))}>
        <Lightbulb className="w-3 h-3" /> {suggest(counts).t}
      </p>
    </button>
  );

  if (!characters.length && !ohne.length) return null;

  return (
    <div className="rounded-2xl border border-border bg-background/40 p-2">
      <p className="px-1 pb-1.5 text-[12px] font-bold text-primary flex items-center gap-1.5">
        <Lightbulb className="w-3.5 h-3.5" /> Verfügbarkeit je Charakter
      </p>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
        {rows.map(({ char, counts, total }) => renderRow(char.name, counts, total, () => onSelectChar?.(char.id)))}
        {ohne.length > 0 && renderRow("Ohne Zuordnung", ohneCounts, ohne.length, () => onSelectChar?.("__ohne"))}
      </div>
    </div>
  );
}