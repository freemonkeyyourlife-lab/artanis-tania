import React from "react";
import { Pencil, Trash2, ShieldCheck, ShieldAlert } from "lucide-react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";

// Eine Figur als Karte: was man auf einen Blick braucht.
export default function CharacterTile({ character, paletteList = [], voices = [], modules = [], onEdit, onDelete }) {
  const neigungen = (character.neigungen || [])
    .map((key) => (paletteList || []).find((p) => (p.key || p.id) === key)?.label || key)
    .filter(Boolean);
  const voice = (voices || []).find((v) => v.id === character.voiceId);
  const roles = (modules || [])
    .filter((m) => (character.moduleIds || []).includes(m.id))
    .map((m) => m.title);

  return (
    <div className="glass rounded-2xl border border-border p-4">
      <div className="flex items-start gap-3">
        {character.avatar ? (
          <Image src={character.avatar} fittingType="fill" className="h-16 w-16 flex-shrink-0 rounded-2xl" />
        ) : (
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-elevated font-display text-xl text-primary">
            {(character.name || "?").charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-heading text-[15px] text-foreground">{character.name}</span>
            <span className="flex-shrink-0 text-[11px] text-muted-foreground">{character.adultAge}+</span>
          </div>
          <p className="truncate text-[12px] text-muted-foreground">
            {character.art || "Art noch offen"}
            {character.createdByRole === "DAVID" ? " · von David" : " · von Gast"}
          </p>
          <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
            {character.fictional === false ? (
              <>
                <ShieldAlert className={cn("h-3.5 w-3.5", character.sourceConsentVerified ? "text-primary" : "text-destructive")} />
                {character.sourceConsentVerified ? "real · Freigabe liegt vor" : "real · Freigabe fehlt"}
              </>
            ) : (
              <>
                <ShieldCheck className="h-3.5 w-3.5 text-primary" /> fiktiv, 18+
              </>
            )}
          </p>
        </div>
        <div className="flex flex-shrink-0 gap-1">
          <button onClick={() => onEdit?.(character)} title="Bearbeiten" className="rounded-full p-2 text-muted-foreground hover:text-foreground">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => onDelete?.(character)} title="Löschen" className="rounded-full p-2 text-muted-foreground hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {neigungen.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {neigungen.map((n) => (
            <span key={n} className="rounded-full border border-border px-2.5 py-0.5 text-[11px] text-foreground">
              {n}
            </span>
          ))}
        </div>
      )}

      {roles.length > 0 && (
        <p className="mt-2 text-[11px] text-muted-foreground">Rollen: {roles.join(", ")}</p>
      )}

      <p className="mt-2 text-[11px] text-muted-foreground">
        Stimme: {voice ? voice.name : "noch keine gewählt"}
      </p>
    </div>
  );
}