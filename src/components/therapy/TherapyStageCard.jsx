import React from "react";
import { Image } from "@/components/ui/image";
import { therapistName, therapistLine, roleLabel } from "@/lib/therapyPrompts";
import { GRUNDSETTINGS } from "@/lib/grundsetting";

// Zeigt groß, mit wem du in dieser Sitzung redest — die Therapeutin, ihr Bild,
// ihr Name und ihre Rolle. Damit ist sofort klar, wer dir gegenübersitzt.
// Die aktiven Grundsettings stehen als Badges darunter.
export default function TherapyStageCard({ session }) {
  if (!session) return null;
  const name = therapistName(session);
  const avatar = session.therapistAvatar;
  const grund = (session.grundsetting || [])
    .map((k) => GRUNDSETTINGS.find((g) => g.key === k))
    .filter(Boolean);

  return (
    <div className="flex items-center gap-4 mb-4">
      {avatar ? (
        <Image src={avatar} className="w-20 h-20 rounded-2xl flex-shrink-0" />
      ) : (
        <div className="w-20 h-20 rounded-2xl bg-elevated flex items-center justify-center font-display text-3xl text-primary flex-shrink-0">
          {name.slice(0, 1)}
        </div>
      )}
      <div className="min-w-0">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Du redest mit</p>
        <h2 className="font-display text-xl text-foreground truncate">{name}</h2>
        <p className="text-xs text-muted-foreground truncate">{therapistLine(session)} · {roleLabel(session)}</p>
        {grund.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {grund.map((g) => (
              <span key={g.key} className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold">
                {g.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}