import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

// Text zum Kopieren. Fällt auf die klassische Kopiermethode zurück, weil der
// Browser im Vorschaufenster den Zugriff auf die Zwischenablage oft sperrt.
export default function CopyBlock({ text, className = "" }) {
  const [done, setDone] = useState(false);

  const flash = () => {
    setDone(true);
    setTimeout(() => setDone(false), 1600);
  };

  const fallback = () => {
    const area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    try {
      document.execCommand("copy");
    } catch (e) {
      /* nichts zu retten — der Text steht ja sichtbar da */
    }
    document.body.removeChild(area);
    flash();
  };

  const copy = () => {
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(flash).catch(fallback);
    } else {
      fallback();
    }
  };

  return (
    <div className={`relative ${className}`}>
      <pre className="whitespace-pre-wrap break-words rounded-xl bg-background border border-border px-3 py-3 pr-12 text-[12.5px] leading-relaxed font-mono text-foreground/90">
        {text}
      </pre>
      <button
        onClick={copy}
        title="Prompt kopieren"
        className="absolute top-2 right-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full glass-btn text-[11px] font-bold text-foreground hover:text-primary transition-colors"
      >
        {done ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {done ? "Kopiert" : "Kopieren"}
      </button>
    </div>
  );
}