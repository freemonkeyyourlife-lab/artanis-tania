import React, { useEffect, useState } from "react";
import { Users, ChevronDown, Gamepad2, Eye, Clapperboard } from "lucide-react";
import { cn } from "@/lib/utils";

// Gast-Rolle im Call zuweisen: Spieler (macht mit), Zuschauer (schaut), Regie
// (lenkt). Nur für den Gastgeber. Die Wahl wird beim Wechsel im Chat
// bekanntgegeben, damit das Szenario und der Bot sich sofort darauf einstellen.

const ROLES = [
  { id: "SPIELER", icon: Gamepad2, label: "Spieler", hint: "Macht im Szenario mit." },
  { id: "ZUSCHAUER", icon: Eye, label: "Zuschauer", hint: "Schaut zu, ohne einzugreifen." },
  { id: "REGIE", icon: Clapperboard, label: "Regie", hint: "Lenkt das Geschehen." },
];

const keyFor = (token) => `artanis_guest_role_${token}`;

export default function CallGuestRole({ token, isHost, onAnnounce }) {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState("ZUSCHAUER");

  useEffect(() => {
    try { const v = localStorage.getItem(keyFor(token)); if (v) setRole(v); } catch { /* privat */ }
  }, [token]);

  const pick = (id) => {
    setRole(id);
    try { localStorage.setItem(keyFor(token), id); } catch { /* privat */ }
    setOpen(false);
    onAnnounce?.(ROLES.find((r) => r.id === id)?.label || id);
  };

  if (!isHost) return null;
  const current = ROLES.find((r) => r.id === role) || ROLES[1];
  const Icon = current.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title="Gast-Rolle zuweisen"
        className={cn(
          "inline-flex items-center gap-1.5 px-3 h-9 rounded-full text-xs font-semibold transition-colors",
          open ? "bg-primary text-primary-foreground" : "bg-elevated text-muted-foreground hover:text-foreground"
        )}
      >
        <Icon className="w-4 h-4" /> <span className="hidden sm:inline">Gast: {current.label}</span>
        <ChevronDown className="w-3.5 h-3.5 opacity-60" />
      </button>
      {open && (
        <>
          <button className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-label="schließen" />
          <div className="absolute right-0 top-11 z-50 w-56 rounded-2xl border border-border bg-popover p-1.5 shadow-2xl">
            {ROLES.map((r) => (
              <button
                key={r.id}
                onClick={() => pick(r.id)}
                className={cn(
                  "flex w-full items-start gap-2.5 rounded-xl p-2.5 text-left transition-colors",
                  role === r.id ? "bg-primary/10" : "hover:bg-elevated"
                )}
              >
                <r.icon className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-foreground">{r.label}</span>
                  <span className="block text-[11px] text-muted-foreground leading-snug">{r.hint}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}