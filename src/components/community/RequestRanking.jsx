import React from "react";
import { ArrowBigUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { REQUEST_TYPE_LABELS } from "@/lib/requestTypes";

// Die Rangliste: Die Stimmen der Community entscheiden die Reihenfolge. Der
// Balken im Hintergrund zeigt auf einen Blick, wie weit eine Idee vorne liegt.
export default function RequestRanking({ requests, currentUserId, onVote }) {
  const top = Math.max(1, ...requests.map((r) => r.votes || 0));

  return (
    <ol className="space-y-2">
      {requests.map((request, index) => {
        const votes = request.votes || 0;
        const voted = (request.votedBy || []).includes(currentUserId);
        const share = Math.round((votes / top) * 100);

        return (
          <li key={request.id} className="relative overflow-hidden rounded-2xl border border-border bg-card">
            <div className="absolute inset-y-0 left-0 bg-primary/10 transition-all" style={{ width: `${share}%` }} />
            <div className="relative flex items-center gap-3 sm:gap-4 px-3 sm:px-4 py-3">
              <span className={cn("w-6 text-center font-display text-lg flex-shrink-0", index < 3 ? "text-primary" : "text-muted-foreground")}>
                {index + 1}
              </span>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-primary">
                  {REQUEST_TYPE_LABELS[request.type] || request.type}
                </span>
                <p className="text-sm font-medium text-foreground truncate">{request.title}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {request.creatorName ? `${request.creatorName} · ` : ""}von {request.userName || "Anonym"}
                </p>
              </div>
              <button
                onClick={() => onVote?.(request)}
                disabled={!currentUserId}
                title={currentUserId ? (voted ? "Stimme zurücknehmen" : "Für diese Idee stimmen") : "Melde dich an, um abzustimmen"}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border transition-all flex-shrink-0 disabled:opacity-50",
                  voted ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                )}
              >
                <ArrowBigUp className={cn("w-5 h-5", voted ? "fill-primary text-primary" : "text-muted-foreground")} />
                <span className={cn("text-sm font-semibold", voted ? "text-primary" : "text-foreground")}>{votes}</span>
              </button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}