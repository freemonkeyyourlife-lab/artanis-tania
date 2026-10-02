import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { zoneId } from "@/lib/floating";

// Hängt seinen Inhalt in den festen Platz dieser Zone. Die Reihenfolge im Platz
// ergibt sich daraus, wer zuerst da war — sie ist fest und ändert sich nicht.
export default function FloatingSlot({ zone, children }) {
  const [host, setHost] = useState(null);

  useEffect(() => {
    setHost(document.getElementById(zoneId(zone)));
  }, [zone]);

  if (!host) return null;
  return createPortal(children, host);
}