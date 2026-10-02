import React from "react";
import { ZONES, zoneId } from "@/lib/floating";

// Die festen Plätze. Sie stehen immer da — gefüllt sind sie nur, wenn es etwas
// zu zeigen gibt. Jedes schwebende Element hängt sich hier hinein, statt sich
// seine Position selbst zu suchen.
export default function FloatingZones() {
  return (
    <>
      {Object.entries(ZONES).map(([zone, place]) => (
        <div key={zone} id={zoneId(zone)} className={place.className} />
      ))}
    </>
  );
}