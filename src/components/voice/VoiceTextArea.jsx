import React from "react";
import { cn } from "@/lib/utils";
import { inputCls } from "@/lib/narratorUi";
import VoiceInput from "@/components/VoiceInput";

// Tippen oder sprechen: das Mikro sitzt im Feld und hängt das Gesagte an den
// Text an. So beschreibst du laut, wie sie ist — und es kommt auch so an.
export default function VoiceTextArea({ value, onChange, className, rows = 4, ...rest }) {
  const append = (text) => {
    const current = value || "";
    onChange([current, text].filter(Boolean).join(current.trim() ? " " : ""));
  };

  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        className={cn(inputCls, "resize-none pr-14", className)}
        {...rest}
      />
      <VoiceInput onResult={append} className="absolute bottom-2 right-2" />
    </div>
  );
}