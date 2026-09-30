import React from "react";
import { Link } from "react-router-dom";
import { Eye, Trash2 } from "lucide-react";
import StatusMark from "@/components/owner/StatusMark";

// Eine Zeile: Was ist es, wie steht es darum, wo schaue ich es mir an —
// und hinten das Auge und der Mülleimer.
export default function LageRow({ state, label, count, hint, to, onReset, resetTitle = "Zurücksetzen" }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-border/60 last:border-0">
      <StatusMark state={state} className="flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-bold text-foreground">
          {label}
          {typeof count === "number" && <span className="ml-2 text-xs font-bold text-muted-foreground">{count}</span>}
        </p>
        <p className="text-[13px] font-semibold text-muted-foreground leading-relaxed">{hint}</p>
      </div>
      {to && (
        <Link
          to={to}
          title="Anschauen"
          className="w-9 h-9 rounded-full glass-btn flex items-center justify-center text-muted-foreground hover:text-primary flex-shrink-0"
        >
          <Eye className="w-4 h-4" />
        </Link>
      )}
      {onReset && (
        <button
          onClick={onReset}
          title={resetTitle}
          className="w-9 h-9 rounded-full bg-destructive/15 text-destructive flex items-center justify-center hover:bg-destructive/25 flex-shrink-0"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}