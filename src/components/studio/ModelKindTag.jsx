import React from "react";
import { Image as ImageIcon, Film, Type } from "lucide-react";
import { cn } from "@/lib/utils";

// Damit auf einen Blick klar ist, wovon hier die Rede ist: Bild, Video oder Text.
const KINDS = {
  BILD: { label: "Bild", icon: ImageIcon, cls: "bg-primary/15 text-primary border-primary/30" },
  VIDEO: { label: "Video", icon: Film, cls: "bg-violet-600/20 text-violet-300 border-violet-500/30" },
  TEXT: { label: "Text", icon: Type, cls: "bg-emerald-600/20 text-emerald-400 border-emerald-500/30" },
};

export default function ModelKindTag({ kind, className }) {
  const entry = KINDS[kind];
  if (!entry) return null;
  const Icon = entry.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-bold uppercase tracking-wider",
        entry.cls,
        className
      )}
    >
      <Icon className="w-3.5 h-3.5" /> {entry.label}
    </span>
  );
}