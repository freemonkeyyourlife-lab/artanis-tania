import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Heart } from "lucide-react";
import Begleitung from "./Begleitung";

// Schwebender Startknopf für die Begleitung. Nur für die Besitzerin (admin)
// sichtbar — das Werkzeug gehört in den privaten Bereich. Öffnet das
// Companion-Panel, das situativ (Videochat, Studio, Nachrichten …) stellbar ist.

export default function BegleitungLauncher() {
  const [show, setShow] = useState(false);
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let on = true;
    base44.auth.me()
      .then((u) => { if (on) setAllowed(u?.role === "admin"); })
      .catch(() => { if (on) setAllowed(false); });
    return () => { on = false; };
  }, []);

  if (!allowed) return null;

  return (
    <>
      {!show && (
        <button
          onClick={() => setShow(true)}
          title="Begleitung öffnen"
          className="glass-btn glass-btn-accent fixed bottom-4 right-4 z-[79] grid h-14 w-14 place-items-center rounded-full shadow-xl"
        >
          <Heart className="h-6 w-6" />
        </button>
      )}
      {show && <Begleitung onClose={() => setShow(false)} />}
    </>
  );
}