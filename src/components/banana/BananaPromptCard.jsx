import React from "react";
import { AlertTriangle } from "lucide-react";
import CopyBlock from "@/components/banana/CopyBlock";

// Ein fertiges Prompt-Modul: was es macht, welches Modell, der Text zum
// Kopieren und die Stellen, an denen es schiefgeht.
export default function BananaPromptCard({ module }) {
  return (
    <div className="rounded-2xl glass border-2 border-border p-5">
      <h3 className="text-[17px] font-display text-foreground">{module.title}</h3>
      <p className="text-[13px] font-semibold text-muted-foreground mt-1">{module.goal}</p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="px-2.5 py-1 rounded-full bg-elevated border border-border text-[11px] font-bold text-primary">
          {module.model}
        </span>
        <span className="px-2.5 py-1 rounded-full bg-elevated border border-border text-[11px] font-semibold text-muted-foreground">
          {module.params}
        </span>
      </div>

      <CopyBlock text={module.prompt} className="mt-3" />

      <div className="mt-3 space-y-1.5">
        {module.watch.map((w) => (
          <p key={w} className="flex items-start gap-2 text-[12.5px] font-semibold text-foreground/85">
            <AlertTriangle className="w-3.5 h-3.5 text-primary flex-shrink-0 mt-0.5" />
            <span>{w}</span>
          </p>
        ))}
      </div>
    </div>
  );
}