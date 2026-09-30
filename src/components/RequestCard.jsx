import React from "react";
import { ArrowBigUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { REQUEST_TYPE_LABELS } from "@/lib/requestTypes";

export default function RequestCard({ request, currentUserId, onVote, className }) {
  const voted = (request.votedBy || []).includes(currentUserId);
  const votes = request.votes || 0;

  return (
    <div className={cn("p-4 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-primary">{REQUEST_TYPE_LABELS[request.type] || request.type}</span>
          <h4 className="text-sm font-medium text-foreground mt-1 line-clamp-2">{request.title}</h4>
          {request.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{request.description}</p>}
          <p className="text-xs text-muted-foreground mt-2">by {request.userName || "Anonymous"}</p>
        </div>
        <button
          onClick={() => onVote?.(request)}
          disabled={!currentUserId}
          title={currentUserId ? (voted ? "Stimme zurücknehmen" : "Für diese Idee stimmen") : "Melde dich an, um abzustimmen"}
          className={cn("flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border transition-all flex-shrink-0 disabled:opacity-50", voted ? "border-primary bg-primary/10" : "border-border hover:border-primary/30")}
        >
          <ArrowBigUp className={cn("w-5 h-5", voted ? "fill-primary text-primary" : "text-muted-foreground")} />
          <span className={cn("text-sm font-semibold", voted ? "text-primary" : "text-foreground")}>{votes}</span>
        </button>
      </div>
    </div>
  );
}