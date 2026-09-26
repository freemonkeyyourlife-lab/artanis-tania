import React from "react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
  ONLINE: { label: "Online", dot: "bg-emerald-400" },
  LIVE: { label: "Live", dot: "bg-red-500" },
  BUSY: { label: "Busy", dot: "bg-amber-400" },
  AWAY: { label: "Away", dot: "bg-amber-400" },
  OFFLINE: { label: "Offline", dot: "bg-slate-500" },
  AI_AVAILABLE: { label: "AI Available", dot: "bg-emerald-400" },
  SCHEDULED: { label: "Scheduled", dot: "bg-blue-400" },
};

const EXPERIENCE_CONFIG = {
  LIVE: { label: "LIVE", className: "bg-red-500/90 text-white" },
  PRERECORDED_INTERACTIVE: { label: "PRERECORDED INTERACTIVE", className: "bg-primary text-primary-foreground" },
  AI_INTERACTIVE: { label: "AI INTERACTIVE", className: "bg-violet-600 text-white" },
};

export default function StatusBadge({ status, experienceType, className }) {
  if (experienceType && EXPERIENCE_CONFIG[experienceType]) {
    const cfg = EXPERIENCE_CONFIG[experienceType];
    return (
      <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase", cfg.className, className)}>
        {experienceType === "LIVE" && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
        {cfg.label}
      </span>
    );
  }
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.OFFLINE;
  return (
    <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-wider uppercase glass text-foreground", className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot, status === "LIVE" && "animate-pulse")} />
      {cfg.label}
    </span>
  );
}