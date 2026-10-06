import React, { useEffect, useState } from "react";
import { Crown } from "lucide-react";
import NavGroup from "@/components/nav/NavGroup";
import { isGodMode, setGodMode, subscribeGodMode } from "@/lib/godMode";
import { cn } from "@/lib/utils";

// God-Mode und Verwaltung stehen unten rechts — immer erreichbar, ohne dass
// die Kopfzeile voll wird.
export default function OwnerCorner({ adminGroup, waitingChats = 0 }) {
  const [god, setGod] = useState(isGodMode());

  useEffect(() => subscribeGodMode(() => setGod(isGodMode())), []);

  if (!adminGroup) return null;

  return (
    <div className="fixed right-4 bottom-24 lg:bottom-6 z-[60] flex items-center gap-1.5 glass-strong rounded-full p-1.5">
      <button
        onClick={() => setGodMode(!god)}
        title={god ? "God Mode ausschalten" : "God Mode einschalten"}
        className={cn(
          "inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold transition-colors",
          god ? "glass-btn text-yellow-300" : "glass-btn text-muted-foreground hover:text-foreground"
        )}
      >
        <Crown className="w-4 h-4" /> God Mode
      </button>
      <NavGroup group={adminGroup} gold waitingChats={waitingChats} />
    </div>
  );
}