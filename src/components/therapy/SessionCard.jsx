import React from "react";
import { Link } from "react-router-dom";
import { Lock, Users } from "lucide-react";
import { THERAPY_MODES, INTENSITIES } from "@/lib/therapyPrompts";

export default function SessionCard({ session, own = false }) {
  const mode = THERAPY_MODES.find((m) => m.value === session.mode);
  const intensity = INTENSITIES.find((i) => i.value === session.intensity);

  return (
    <Link
      to={`/therapy/${session.id}`}
      className="block rounded-2xl border border-border bg-card p-4 hover:border-primary/50 transition-colors"
    >
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className="px-2.5 py-1 rounded-full bg-primary/15 text-primary text-[11px] font-semibold">
          {session.roleSetup === "USER_THERAPIST" ? "Du führst" : "Triania führt"}
        </span>
        {mode && <span className="px-2.5 py-1 rounded-full bg-elevated text-muted-foreground text-[11px]">{mode.label}</span>}
        {intensity && <span className="px-2.5 py-1 rounded-full bg-elevated text-muted-foreground text-[11px]">{intensity.label}</span>}
        {session.status === "DONE" && (
          <span className="px-2.5 py-1 rounded-full bg-elevated text-muted-foreground text-[11px]">beendet</span>
        )}
      </div>
      <p className="text-[15px] text-foreground leading-snug line-clamp-3">{session.topic}</p>
      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
        <span className="truncate">{session.anonymous ? "Anonym" : session.userName || "Unbekannt"}</span>
        <span className="flex items-center gap-1">
          {own ? <Lock className="w-3 h-3" /> : <Users className="w-3 h-3" />}
          {session.visibility === "PRIVATE" ? "vertraulich" : "offen"}
        </span>
      </div>
    </Link>
  );
}