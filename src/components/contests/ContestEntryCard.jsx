import React from "react";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import { Heart, Crown, Check, X, Trash2, User as UserIcon } from "lucide-react";

export default function ContestEntryCard({ entry, contest, currentUser, votesUsed, onVote, onAdmin }) {
  const isAdmin = currentUser?.role === "admin";
  const voted = (entry.votedBy || []).includes(currentUser?.id);
  const canVoteMore = votesUsed < (contest.votesPerUser || 1);
  const isWinner = entry.status === "WINNER";

  return (
    <div className={cn("rounded-2xl border bg-card overflow-hidden flex flex-col", isWinner ? "border-primary" : "border-border")}>
      <div className="relative bg-elevated">
        {entry.mediaType === "VIDEO" && entry.mediaUrl ? (
          <video src={entry.mediaUrl} controls playsInline className="w-full aspect-square object-cover" />
        ) : entry.mediaType === "IMAGE" && entry.mediaUrl ? (
          <Image src={entry.mediaUrl} fittingType="fill" className="w-full aspect-square" />
        ) : (
          <div className="w-full aspect-square p-4 flex items-center justify-center">
            <p className="text-sm text-muted-foreground text-center line-clamp-6">{entry.description}</p>
          </div>
        )}

        {isWinner && (
          <span className="absolute top-2 left-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase">
            <Crown className="w-3 h-3" /> Gewinner
          </span>
        )}
        {entry.status === "PENDING" && (
          <span className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-amber-500/90 text-black text-[10px] font-semibold uppercase">
            Prüfung
          </span>
        )}
        {entry.status === "REJECTED" && (
          <span className="absolute top-2 right-2 px-2.5 py-1 rounded-full bg-destructive text-white text-[10px] font-semibold uppercase">
            Abgelehnt
          </span>
        )}
      </div>

      <div className="p-3 flex flex-col flex-1">
        {entry.title && <p className="text-sm font-medium text-foreground">{entry.title}</p>}
        {entry.title && entry.mediaType !== "TEXT" && entry.description && (
          <p className="text-xs text-muted-foreground mt-1 line-clamp-3">{entry.description}</p>
        )}
        <p className="text-[11px] text-muted-foreground mt-2 inline-flex items-center gap-1">
          <UserIcon className="w-3 h-3" />
          {entry.anonymous ? "Anonym" : entry.userName || "Unbekannt"}
        </p>

        <div className="mt-auto pt-3 flex items-center gap-2">
          <button
            onClick={() => onVote(entry)}
            disabled={voted || (!isAdmin && !canVoteMore)}
            className={cn(
              "flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-colors",
              voted
                ? "bg-primary/15 text-primary"
                : canVoteMore || isAdmin
                ? "bg-primary text-primary-foreground hover:opacity-90"
                : "bg-elevated text-muted-foreground/50 cursor-not-allowed"
            )}
          >
            <Heart className={cn("w-3.5 h-3.5", voted && "fill-current")} />
            {voted ? "Abgestimmt" : "Stimme"} · {entry.votes || 0}
          </button>

          {isAdmin && onAdmin && (
            <>
              {entry.status === "PENDING" && (
                <button onClick={() => onAdmin(entry, "approve")} title="Freigeben" className="w-9 h-9 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center hover:bg-emerald-600/30 transition-colors">
                  <Check className="w-3.5 h-3.5" />
                </button>
              )}
              {entry.status !== "WINNER" && (
                <button onClick={() => onAdmin(entry, "winner")} title="Zum Gewinner küren" className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center hover:bg-primary/25 transition-colors">
                  <Crown className="w-3.5 h-3.5" />
                </button>
              )}
              <button onClick={() => onAdmin(entry, "reject")} title="Ablehnen" className="w-9 h-9 rounded-full bg-destructive/15 text-destructive flex items-center justify-center hover:bg-destructive/25 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => onAdmin(entry, "delete")} title="Löschen" className="w-9 h-9 rounded-full bg-elevated border border-border text-muted-foreground flex items-center justify-center hover:text-foreground transition-colors">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}