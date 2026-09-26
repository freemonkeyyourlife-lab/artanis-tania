import React from "react";
import { Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { downloadMedia } from "@/lib/download";

export default function DownloadButton({ url, filename, label, className }) {
  if (!url) return null;
  return (
    <button
      onClick={(e) => { e.stopPropagation(); downloadMedia(url, filename); }}
      title="Herunterladen"
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-black/65 px-2.5 py-1 text-[11px] text-white hover:bg-black/85 transition-colors",
        className
      )}
    >
      <Download className="w-3.5 h-3.5" />
      {label || "Speichern"}
    </button>
  );
}