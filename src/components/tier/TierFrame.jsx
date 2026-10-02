import React from "react";
import { useLocation } from "react-router-dom";
import { tierForPath, TIER, TIER_BADGE, TIER_LABEL } from "@/lib/accessTiers";
import { cn } from "@/lib/utils";

// Jede Seite, die nur mit Rechten erreichbar ist, bekommt einen gelben Rahmen
// mit ihrer Stufe dran. Der Nutzerbereich bleibt unmarkiert.
export default function TierFrame({ children }) {
  const { pathname } = useLocation();
  const tier = tierForPath(pathname);
  if (tier === TIER.USER) return children;

  return (
    <div className="relative rounded-3xl border-2 border-yellow-400 p-2">
      <span
        className={cn(
          "absolute -top-3 left-5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider",
          TIER_BADGE[tier]
        )}
      >
        {TIER_LABEL[tier]}
      </span>
      {children}
    </div>
  );
}