import React from "react";
import { Image } from "@/components/ui/image";
import { Input } from "@/components/ui/input";
import { Globe, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

// Jede Fundstück-Zeile ist hier ein kleines Formular: nichts ist festgelegt,
// alles darf vor dem Übernehmen noch geändert werden.

const KINDS = [
  { id: "MODELL", label: "Modell", target: "Modell-Links" },
  { id: "CHARAKTER", label: "Charakter", target: "neues Profil" },
  { id: "BILD", label: "Bild", target: "Inhalte" },
  { id: "VIDEO", label: "Video", target: "Inhalte" },
  { id: "AUDIO", label: "Audio", target: "Inhalte" },
  { id: "LINK", label: "Link", target: "Dienste-Liste" },
];

const MODEL_KINDS = [
  { id: "BILD", label: "Bild-Modell" },
  { id: "TEXT", label: "Text-Modell" },
  { id: "VIDEO", label: "Video-Modell" },
  { id: "AUDIO", label: "Audio-Modell" },
];

const CAP = "block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1";
const FIELD = "h-9 text-[13px] font-semibold";
const PICK =
  "w-full h-9 px-3 rounded-md bg-background border border-border text-[13px] font-semibold text-foreground";

export default function HarvestEditRow({ row, checked, onToggle, onChange }) {
  const set = (patch) => onChange(row.rid, patch);
  const kind = KINDS.find((k) => k.id === row.kind) || KINDS[5];
  const preview = row.kind === "BILD" || row.kind === "VIDEO" ? row.url : row.image || "";

  return (
    <div className={cn("rounded-xl border border-border bg-elevated p-3", !checked && "opacity-60")}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(row.rid)}
          className="w-4 h-4 mt-1 accent-primary flex-shrink-0"
        />

        <div className="w-14 h-14 rounded-xl bg-background border border-border overflow-hidden flex-shrink-0">
          {preview ? (
            <Image src={preview} fittingType="fill" className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Globe className="w-5 h-5 text-muted-foreground" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <select value={row.kind} onChange={(e) => set({ kind: e.target.value })} className={cn(PICK, "w-auto")}>
              {KINDS.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </select>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              → {kind.target}
            </span>
            {row.ok === false && (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-destructive" title={row.error}>
                <AlertTriangle className="w-3.5 h-3.5" /> nicht gelesen
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label className="block">
              <span className={CAP}>Name</span>
              <Input value={row.label} onChange={(e) => set({ label: e.target.value })} className={FIELD} />
            </label>
            <label className="block">
              <span className={CAP}>Adresse</span>
              <Input value={row.url} onChange={(e) => set({ url: e.target.value })} className={FIELD} />
            </label>
          </div>

          {row.kind === "MODELL" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="block">
                <span className={CAP}>Modell-Art</span>
                <select
                  value={row.modelKind || "BILD"}
                  onChange={(e) => set({ modelKind: e.target.value })}
                  className={PICK}
                >
                  {MODEL_KINDS.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={CAP}>Notiz</span>
                <Input value={row.note} onChange={(e) => set({ note: e.target.value })} className={FIELD} />
              </label>
            </div>
          )}

          {row.kind === "CHARAKTER" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="block">
                <span className={CAP}>Kurzzeile</span>
                <Input value={row.tagline} onChange={(e) => set({ tagline: e.target.value })} className={FIELD} />
              </label>
              <label className="block">
                <span className={CAP}>Beschreibung</span>
                <Input value={row.bio} onChange={(e) => set({ bio: e.target.value })} className={FIELD} />
              </label>
            </div>
          )}

          {row.kind === "LINK" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="block">
                <span className={CAP}>Kategorie</span>
                <Input value={row.category} onChange={(e) => set({ category: e.target.value })} className={FIELD} />
              </label>
              <label className="block">
                <span className={CAP}>Notiz</span>
                <Input value={row.note} onChange={(e) => set({ note: e.target.value })} className={FIELD} />
              </label>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}