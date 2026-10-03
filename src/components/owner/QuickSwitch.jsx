import React, { useEffect, useState } from "react";
import { User, ShieldCheck, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { getViewAs, setViewAs, subscribeViewAs, testUsers } from "@/lib/viewAs";

// Immer erreichbar, auf jeder Seite: mit einem Klick in die Nutzer-Ansicht und
// wieder zurück — und das Studio daneben in einem eigenen Fenster, damit du beim
// Testen nicht aus der App geworfen wirst und hin und her springen kannst.
export default function QuickSwitch({ isOwner }) {
  const [current, setCurrent] = useState(getViewAs);

  useEffect(() => subscribeViewAs(() => setCurrent(getViewAs())), []);

  if (!isOwner) return null;

  const asUser = !!current;
  const users = testUsers();
  const normalUser = users.find((u) => u.memberStatus !== "GOLD") || users[0];

  return (
    <div className="fixed left-4 bottom-24 lg:bottom-6 z-[60] flex items-center gap-1.5 glass-strong rounded-full p-1.5">
      <button
        onClick={() => setViewAs(asUser ? null : normalUser)}
        disabled={!asUser && !normalUser}
        title={asUser ? "Zurück zu deiner Ansicht" : "Die App als normaler Nutzer testen"}
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition-colors disabled:opacity-50",
          asUser ? "glass-btn text-amber-300" : "glass-btn glass-btn-accent text-gloss"
        )}
      >
        {asUser ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
        {asUser ? "Zurück zu mir" : "Als Nutzer"}
      </button>

      <a
        href="/betreiber"
        target="_blank"
        rel="noreferrer"
        title="Studio in einem eigenen Fenster öffnen"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-btn text-[13px] font-bold text-foreground hover:text-primary transition-colors"
      >
        Studio <ExternalLink className="w-3.5 h-3.5" />
      </a>

      {asUser && (
        <span className="hidden sm:inline px-3 text-[12px] font-bold text-amber-300 whitespace-nowrap">
          {current.name}
        </span>
      )}
    </div>
  );
}