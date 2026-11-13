import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Aufklappbares Menü für die Seitenleiste: ein Header, der auf-/zuklappt,
// darunter die Einträge. Einträge mit `to` navigieren, Einträge mit `onClick`
// öffnen etwas inline (z. B. die Studio-Schublade) — ohne die Seite zu verlassen.

export default function SidebarExpandMenu({ label, icon: Icon, items, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-border bg-card/60 overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-left"
      >
        {Icon && <Icon className="w-4 h-4 text-primary flex-shrink-0" />}
        <span className="flex-1 font-bold text-foreground text-[13px]">{label}</span>
        {open ? (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
        )}
      </button>
      {open && (
        <div className="px-2 pb-2 space-y-0.5">
          {items.map((it, i) =>
            it.to ? (
              <Link
                key={i}
                to={it.to}
                onClick={it.onClick}
                className="block rounded-xl px-3 py-1.5 text-[12px] font-semibold text-muted-foreground hover:bg-white/5 hover:text-foreground"
              >
                {it.label}
              </Link>
            ) : (
              <button
                key={i}
                onClick={it.onClick}
                className="w-full text-left rounded-xl px-3 py-1.5 text-[12px] font-semibold text-muted-foreground hover:bg-white/5 hover:text-foreground"
              >
                {it.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}