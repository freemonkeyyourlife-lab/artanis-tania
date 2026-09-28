import React from "react";
import { cn } from "@/lib/utils";

// Trennt im Chat, was passiert (*kursiv*) von dem, was gesagt wird.
export default function ChatText({ text, className }) {
  if (!text) return null;
  const lines = String(text)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  return (
    <div className={cn("space-y-1.5", className)}>
      {lines.map((line, i) => {
        const narration = line.match(/^\*{1,2}(.+?)\*{1,2}$/) || line.match(/^_(.+?)_$/) || line.match(/^<(.+?)>$/);
        if (narration) {
          return (
            <p key={i} className="italic font-medium text-foreground/75 leading-relaxed">
              {narration[1]}
            </p>
          );
        }
        return (
          <p key={i} className="font-semibold leading-relaxed text-foreground">
            {line.replace(/^\*+|\*+$/g, "")}
          </p>
        );
      })}
    </div>
  );
}