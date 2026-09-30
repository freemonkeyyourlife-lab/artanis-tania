import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Radio } from "lucide-react";
import { cn } from "@/lib/utils";
import { setLiveState } from "@/lib/liveRoom";

// Der Gastgeber meldet sich hier live — danach sehen es alle in der App.
export default function LiveToggle({ token, hostName }) {
  const [live, setLive] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    base44.entities.LiveRoom.filter({ token }).then((rooms) => {
      if (alive) setLive(!!rooms[0]?.isLive);
    });
    return () => { alive = false; };
  }, [token]);

  const toggle = async () => {
    setBusy(true);
    const next = !live;
    await setLiveState(token, hostName, next);
    setLive(next);
    setBusy(false);
  };

  return (
    <button
      onClick={toggle}
      disabled={busy}
      title={live ? "Live-Meldung beenden" : "Alle in der App benachrichtigen"}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider transition-colors flex-shrink-0 disabled:opacity-60",
        live ? "bg-red-500/20 text-red-300" : "bg-elevated text-muted-foreground hover:text-foreground"
      )}
    >
      <Radio className={cn("w-3.5 h-3.5", live && "animate-pulse")} />
      {live ? "Live" : "Live melden"}
    </button>
  );
}