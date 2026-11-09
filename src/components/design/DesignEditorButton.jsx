import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { SlidersHorizontal } from "lucide-react";
import DesignEditor from "@/components/design/DesignEditor";

// Schwebender Design-Editor — nur für Admins sichtbar. Öffnet den globalen
// Editor für Schrift, Zeilenabstand und Akzentfarbe.

export default function DesignEditorButton() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    base44.auth.me().then((u) => setIsAdmin(u?.role === "admin")).catch(() => setIsAdmin(false));
  }, []);

  if (!isAdmin) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title="Design ändern"
        className="fixed bottom-4 left-4 z-40 inline-flex h-11 w-11 items-center justify-center rounded-full glass-btn text-foreground"
      >
        <SlidersHorizontal className="h-5 w-5 text-primary" />
      </button>
      <DesignEditor open={open} onClose={() => setOpen(false)} />
    </>
  );
}