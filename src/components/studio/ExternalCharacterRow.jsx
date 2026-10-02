import React, { useState } from "react";
import { Image } from "@/components/ui/image";
import { Upload, Loader2, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { characterPrompt } from "@/lib/externalPrompt";

const PERSONA = {
  SOLO_MALE: "Mann",
  SOLO_FEMALE: "Frau",
  SHEMALE: "Shemale",
  COUPLE: "Paar",
  GROUP: "Gruppe",
};

// Eine Zeile pro Charakter: Prompt holen, Bild zurücklegen.
export default function ExternalCharacterRow({ creator, onUpload, busy }) {
  const [copied, setCopied] = useState(false);
  const refs = (creator.referenceImages || []).length;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(characterPrompt(creator));
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch (e) {
      /* Zwischenablage verweigert — dann von Hand markieren. */
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-elevated border border-border">
      <div className="w-12 h-12 rounded-xl bg-card overflow-hidden flex-shrink-0 flex items-center justify-center">
        {creator.avatar ? (
          <Image src={creator.avatar} fittingType="fill" className="w-full h-full" />
        ) : (
          <span className="font-display text-lg text-primary">{(creator.stageName || "?")[0]}</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground truncate">{creator.stageName}</p>
        <p className="text-[11px] text-muted-foreground truncate">
          {PERSONA[creator.personaType] || "Frau"} · {creator.artStyle === "CARTOON" ? "Animiert" : "Foto"}
          {refs ? ` · ${refs} Referenzen` : ""}
        </p>
      </div>

      <button
        onClick={copy}
        className={cn(
          "inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors",
          copied ? "bg-emerald-600/20 text-emerald-400" : "bg-card border border-border text-muted-foreground hover:text-foreground"
        )}
      >
        {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        {copied ? "Kopiert" : "Prompt kopieren"}
      </button>

      <label
        className={cn(
          "cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold whitespace-nowrap",
          busy && "opacity-60 pointer-events-none"
        )}
      >
        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
        {busy ? "Lädt …" : creator.avatar ? "Bilder nachlegen" : "Bild hochladen"}
        <input
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onUpload(Array.from(e.target.files || []), creator, e.target)}
        />
      </label>
    </div>
  );
}