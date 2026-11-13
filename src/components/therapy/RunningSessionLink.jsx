import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { MessageSquare } from "lucide-react";

// Ein fester, abgesetzter Link zur aktuell laufenden Sitzung — immer
// erreichbar, egal wo man gerade ist. Verschwindet nur, wenn keine Sitzung
// mehr offen ist oder man sich schon in einer Sitzung befindet.

export default function RunningSessionLink() {
  const [session, setSession] = useState(null);
  const location = useLocation();

  useEffect(() => {
    let alive = true;
    base44.entities.TherapySession.filter({ status: "OPEN" }, "-lastMessageAt", 1)
      .then((r) => {
        if (alive) setSession((r || [])[0] || null);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [location.pathname]);

  if (!session) return null;
  if (location.pathname.startsWith("/therapy/")) return null;

  const label = session.topic || "Laufende Sitzung";
  return (
    <Link
      to={`/therapy/${session.id}`}
      className="fixed bottom-4 left-4 z-40 inline-flex items-center gap-2 px-4 py-2.5 rounded-full glass-btn text-foreground text-xs font-bold shadow-lg max-w-[16rem]"
      title="Zur laufenden Sitzung"
    >
      <MessageSquare className="w-3.5 h-3.5 text-primary flex-shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  );
}