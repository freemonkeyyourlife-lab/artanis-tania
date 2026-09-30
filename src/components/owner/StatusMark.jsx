import React from "react";
import { Check, Minus, X } from "lucide-react";
import { cn } from "@/lib/utils";

// Ein Blick genügt: Haken heißt "steht schon", Strich heißt "kannst du so lassen
// oder anfassen", Kreuz heißt "das fehlt noch".
const STATES = {
  done: { Icon: Check, label: "Steht schon", className: "bg-emerald-600/20 text-emerald-400" },
  open: { Icon: Minus, label: "Noch offen", className: "bg-amber-500/20 text-amber-400" },
  missing: { Icon: X, label: "Fehlt noch", className: "bg-destructive/20 text-destructive" },
};

export default function StatusMark({ state = "open", withLabel = false, className }) {
  const conf = STATES[state] || STATES.open;
  const Icon = conf.Icon;
  return (
    <span
      title={conf.label}
      className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap", conf.className, className)}
    >
      <Icon className="w-3.5 h-3.5" />
      {withLabel && conf.label}
    </span>
  );
}