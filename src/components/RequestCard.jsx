import React, { useState } from "react";
import { ArrowBigUp } from "lucide-react";
import { cn } from "@/lib/utils";

const TYPE_LABELS = {
  VIDEO_IDEA: "Video Idea",
  PHOTO_IDEA: "Photo Idea",
  STORY_IDEA: "Story Idea",
  LIVE_TOPIC: "Live Topic",
  INTERACTIVE_IDEA: "Interactive Idea",
  QUESTION: "Question",
  CUSTOM_REQUEST: "Custom Request",
};

export default function RequestCard({ request, className }) {
  const [voted, setVoted] = useState(false);
  const [votes, setVotes] = useState(request.votes || 0);

  const handleVote = () => {
    setVoted(!voted);
    setVotes(voted ? votes - 1 : votes + 1);
  };

  return (
    <div className={cn("p-4 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <span className="text-[11px] font-semibold tracking-wider uppercase text-primary">{TYPE_LABELS[request.type] || request.type}</span>
          <h4 className="text-sm font-medium text-foreground mt-1 line-clamp-2">{request.title}</h4>
          {request.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{request.description}</p>}
          <p className="text-xs text-muted-foreground mt-2">by {request.userName || "Anonymous"}</p>
        </div>
        <button
          onClick={handleVote}
          className={cn("flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl border transition-all flex-shrink-0", voted ? "border-primary bg-primary/10" : "border-border hover:border-primary/30")}
        >
          <ArrowBigUp className={cn("w-5 h-5", voted ? "fill-primary text-primary" : "text-muted-foreground")} />
          <span className={cn("text-sm font-semibold", voted ? "text-primary" : "text-foreground")}>{votes}</span>
        </button>
      </div>
    </div>
  );
}