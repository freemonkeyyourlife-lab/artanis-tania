import React from "react";
import { Link } from "react-router-dom";
import { Image } from "@/components/ui/image";
import { cn } from "@/lib/utils";
import { Trophy, Clock, Users } from "lucide-react";
import { categoryOf, statusOf, statusLabel, statusClass, timeLeft } from "@/lib/contests";

export default function ContestCard({ contest, entryCount }) {
  const cat = categoryOf(contest);
  const st = statusOf(contest);
  const left = timeLeft(contest.endsAt);

  return (
    <Link
      to={`/contests/${contest.id}`}
      className="group rounded-2xl border border-border bg-card overflow-hidden flex flex-col transition-colors hover:border-primary/50"
    >
      <div className="relative aspect-[16/9] bg-elevated">
        {contest.coverImage ? (
          <Image src={contest.coverImage} fittingType="fill" className="w-full h-full transition-opacity group-hover:opacity-90" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">{cat.icon}</div>
        )}
        <span className={cn("absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide", statusClass(st))}>
          {statusLabel(st)}
        </span>
        {contest.featured && (
          <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold uppercase">
            Top
          </span>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-primary">{cat.icon} {cat.label}</p>
        <p className="font-display text-lg text-foreground mt-1 leading-tight">{contest.title}</p>
        {contest.description && (
          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">{contest.description}</p>
        )}

        <div className="mt-auto pt-3 flex items-center gap-3 flex-wrap text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> {entryCount} Beiträge
          </span>
          {left && (
            <span className="inline-flex items-center gap-1 text-primary">
              <Clock className="w-3.5 h-3.5" /> noch {left}
            </span>
          )}
          {contest.prizeDescription && (
            <span className="inline-flex items-center gap-1">
              <Trophy className="w-3.5 h-3.5" /> Gewinn
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}