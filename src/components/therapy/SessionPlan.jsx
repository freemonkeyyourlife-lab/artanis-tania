import React, { useState } from "react";
import { Image } from "@/components/ui/image";
import { ChevronDown, Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { INTENSITIES, THERAPY_MODES, formatLabel, therapistName, roleLabel } from "@/lib/therapyPrompts";

const Chip = ({ children, tone = "muted" }) => (
  <span className={cn("px-2.5 py-1 rounded-full text-[11px] font-semibold", tone === "primary" ? "bg-primary/15 text-primary" : "bg-elevated text-muted-foreground")}>
    {children}
  </span>
);

// Der Plan der Sitzung auf einen Blick — und aufgeklappt alles, was du
// vorgegeben hast. So weiß jeder, worauf er sich einlässt.
export default function SessionPlan({ session }) {
  const [open, setOpen] = useState(false);
  const cast = session.cast || [];
  const name = therapistName(session);
  const mode = THERAPY_MODES.find((m) => m.value === session.mode);
  const intensity = INTENSITIES.find((i) => i.value === session.intensity);

  const rows = [
    ["Format", formatLabel(session)],
    ["Serie", session.seriesTitle || null],
    ["Thema", session.topic],
    ["Erhofft sich", session.goal],
    ["Ablauf", session.agenda],
    ["Wie sie antwortet", session.therapistStyle],
    ["Ihre Rolle", session.therapistRole],
    ["Ort", session.location],
    ["Alter", session.clientAge],
    ["Vereinbarung", session.agreement],
  ].filter(([, v]) => v);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 mb-4">
      <div className="flex items-center gap-3">
        {session.therapistAvatar ? (
          <Image src={session.therapistAvatar} fittingType="fill" className="w-14 h-14 rounded-full flex-shrink-0" />
        ) : (
          <span className="w-14 h-14 rounded-full bg-primary/15 flex items-center justify-center font-display text-primary flex-shrink-0">{name[0]}</span>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-bold text-foreground truncate">{name}</p>
          <p className="text-xs text-muted-foreground truncate">
            {[session.therapistType, session.therapistAge ? `${session.therapistAge} Jahre` : null].filter(Boolean).join(" · ") || "Therapeutin"}
          </p>
        </div>
        {(session.liveMode || "OFF") !== "OFF" && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/15 text-destructive text-[11px] font-bold whitespace-nowrap flex-shrink-0">
            <Radio className="w-3 h-3" /> Live · {session.liveMode === "CAM" ? "Cam zu Cam" : "nur Stream"}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap mt-3">
        <Chip tone="primary">{roleLabel(session)}</Chip>
        {mode && <Chip>{mode.label}</Chip>}
        {intensity && <Chip>{intensity.label}</Chip>}
        <Chip>{formatLabel(session)}</Chip>
        {cast.filter((c) => c.mode === "PRESENT").length > 0 && <Chip>+{cast.filter((c) => c.mode === "PRESENT").length} anwesend</Chip>}
        {cast.filter((c) => c.mode === "INFORMED").length > 0 && <Chip>{cast.filter((c) => c.mode === "INFORMED").length} informiert</Chip>}
        <button onClick={() => setOpen((v) => !v)} className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground">
          Der Plan <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", open && "rotate-180")} />
        </button>
      </div>

      {open && (
        <div className="mt-3 pt-3 border-t border-border space-y-1.5">
          {rows.map(([label, value]) => (
            <p key={label} className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{label}:</span> {value}
            </p>
          ))}
          {cast.length > 0 && (
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">Besetzung:</span>{" "}
              {cast.map((c) => `${c.name} (${c.mode === "PRESENT" ? "anwesend" : "informiert"})`).join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}