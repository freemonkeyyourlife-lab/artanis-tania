import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Image } from "@/components/ui/image";
import { ArrowLeft, Clock, Trophy, Crown, Coins, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import ContestEntryCard from "@/components/contests/ContestEntryCard";
import ContestEntryForm from "@/components/contests/ContestEntryForm";
import { categoryOf, statusOf, statusLabel, statusClass, timeLeft, formatDate } from "@/lib/contests";

export default function ContestDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const [contest, setContest] = useState(null);
  const [entries, setEntries] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [id]);

  const load = async () => {
    try {
      const [c, e] = await Promise.all([
        base44.entities.Contest.get(id),
        base44.entities.ContestEntry.filter({ contestId: id }, "-created_date", 200),
      ]);
      setContest(c);
      setEntries(e);
      try { setUser(await base44.auth.me()); } catch (err) { /* nicht angemeldet */ }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>;
  }

  if (!contest) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <p className="text-muted-foreground">Diesen Wettbewerb gibt es nicht mehr.</p>
        <Link to="/contests" className="text-primary text-sm hover:underline mt-3 inline-block">← Zu allen Wettbewerben</Link>
      </div>
    );
  }

  const isAdmin = user?.role === "admin";
  const cat = categoryOf(contest);
  const st = statusOf(contest);
  const left = timeLeft(contest.endsAt);
  const votingOpen = contest.votingEnabled && !contest.juryMode && (st === "ACTIVE" || st === "VOTING");
  const myEntries = entries.filter((e) => e.userId === user?.id);
  const canEnter = contest.entriesOpen && st === "ACTIVE" && user && myEntries.length < (contest.maxEntriesPerUser || 1);
  const votesUsed = entries.filter((e) => (e.votedBy || []).includes(user?.id)).length;
  const votesLeft = Math.max(0, (contest.votesPerUser || 1) - votesUsed);

  const visibleEntries = entries
    .filter((e) => isAdmin || e.status === "APPROVED" || e.status === "WINNER" || e.userId === user?.id)
    .sort((a, b) => (b.votes || 0) - (a.votes || 0));

  const vote = async (entry) => {
    if (!user) {
      toast({ title: "Bitte anmelden", description: "Zum Abstimmen brauchst du ein Konto.", variant: "destructive" });
      return;
    }
    if ((entry.votedBy || []).includes(user.id)) return;
    if (votesLeft <= 0) {
      toast({ title: "Keine Stimmen mehr", description: "Du hast alle deine Stimmen vergeben.", variant: "destructive" });
      return;
    }
    try {
      await base44.entities.ContestEntry.update(entry.id, {
        votes: (entry.votes || 0) + 1,
        votedBy: [...(entry.votedBy || []), user.id],
      });
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, votes: (e.votes || 0) + 1, votedBy: [...(e.votedBy || []), user.id] } : e)));
    } catch (err) {
      toast({ title: "Fehler", description: "Stimme konnte nicht gezählt werden.", variant: "destructive" });
    }
  };

  const adminAction = async (entry, action) => {
    try {
      if (action === "approve") {
        await base44.entities.ContestEntry.update(entry.id, { status: "APPROVED" });
        setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, status: "APPROVED" } : e)));
        return;
      }
      if (action === "reject") {
        await base44.entities.ContestEntry.update(entry.id, { status: "REJECTED" });
        setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, status: "REJECTED" } : e)));
        return;
      }
      if (action === "delete") {
        if (!window.confirm("Diesen Beitrag wirklich löschen?")) return;
        await base44.entities.ContestEntry.delete(entry.id);
        setEntries((prev) => prev.filter((e) => e.id !== entry.id));
        return;
      }
      if (action === "winner") {
        if (!window.confirm(`"${entry.title || "Beitrag"}" zum Gewinner küren? Der Wettbewerb wird beendet.`)) return;
        await base44.entities.ContestEntry.update(entry.id, { status: "WINNER" });
        const winnerName = entry.anonymous ? "Anonym" : entry.userName || "Unbekannt";
        await base44.entities.Contest.update(contest.id, {
          winnerEntryId: entry.id,
          winnerUserId: entry.userId,
          winnerName,
          winnerAnnounced: true,
          status: "ENDED",
          entriesOpen: false,
          votingEnabled: false,
        });
        if (contest.prizeGold && entry.userId) {
          await base44.entities.User.update(entry.userId, { memberStatus: "GOLD" }).catch(() => {});
        }
        if ((contest.prizeCoins || 0) > 0 && entry.userId) {
          await base44.functions.invoke("coinWallet", {
            action: "grant",
            userId: entry.userId,
            amount: contest.prizeCoins,
            description: `Gewinn: ${contest.title}`,
          }).catch(() => {});
        }
        setEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, status: "WINNER" } : e)));
        setContest((prev) => ({ ...prev, winnerAnnounced: true, winnerName, winnerEntryId: entry.id, status: "ENDED", entriesOpen: false, votingEnabled: false }));
        toast({ title: "Gewinner gekürt", description: `${winnerName} hat gewonnen.` });
      }
    } catch (err) {
      console.error(err);
      toast({ title: "Fehler", description: "Aktion fehlgeschlagen.", variant: "destructive" });
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8">
      <Link to="/contests" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Alle Wettbewerbe
      </Link>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="relative aspect-[21/9] bg-elevated">
          {contest.coverImage ? (
            <Image src={contest.coverImage} fittingType="fill" className="w-full h-full" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-6xl">{cat.icon}</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-5 lg:p-7">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wide", statusClass(st))}>{statusLabel(st)}</span>
              <span className="px-2.5 py-1 rounded-full bg-black/50 text-foreground text-[10px] font-semibold uppercase tracking-wide">
                {cat.icon} {cat.label}
              </span>
              <span className="px-2.5 py-1 rounded-full bg-black/50 text-foreground text-[10px] font-semibold uppercase tracking-wide">Runde {contest.round || 1}</span>
            </div>
            <h1 className="font-display text-2xl lg:text-4xl text-foreground">{contest.title}</h1>
          </div>
        </div>

        <div className="p-5 lg:p-7 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {contest.description && <p className="text-sm text-muted-foreground leading-relaxed">{contest.description}</p>}
            {contest.rules && (
              <div className="rounded-xl border border-border bg-background/50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Regeln</p>
                <p className="text-sm text-muted-foreground whitespace-pre-line">{contest.rules}</p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-border bg-background/50 p-4 space-y-2.5">
              {left && (
                <p className="text-sm text-foreground inline-flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> noch {left}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {formatDate(contest.startsAt)} – {formatDate(contest.endsAt)}
              </p>
              <p className="text-xs text-muted-foreground">
                {contest.entriesOpen ? "Einsendungen offen" : "Einsendungen geschlossen"} · max. {contest.maxEntriesPerUser || 1} pro Nutzer
              </p>
              {contest.votingEnabled && !contest.juryMode && (
                <p className="text-xs text-muted-foreground inline-flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5" /> {contest.votesPerUser || 1} Stimme(n) pro Nutzer
                </p>
              )}
              {contest.juryMode && <p className="text-xs text-primary">Jury entscheidet</p>}
              {user && votingOpen && votesLeft > 0 && (
                <p className="text-xs text-primary font-medium">Du hast noch {votesLeft} Stimme(n).</p>
              )}
            </div>

            {(contest.prizeDescription || contest.prizeCustom || (contest.prizeCoins || 0) > 0 || contest.prizeGold) && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2 inline-flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5" /> Gewinn
                </p>
                {contest.prizeDescription && <p className="text-sm text-foreground">{contest.prizeDescription}</p>}
                {contest.prizeCustom && <p className="text-sm text-foreground">{contest.prizeCustom}</p>}
                <div className="flex gap-3 flex-wrap mt-1">
                  {(contest.prizeCoins || 0) > 0 && (
                    <span className="text-xs text-primary inline-flex items-center gap-1"><Coins className="w-3.5 h-3.5" /> {contest.prizeCoins} Coins</span>
                  )}
                  {contest.prizeGold && (
                    <span className="text-xs text-primary inline-flex items-center gap-1"><Crown className="w-3.5 h-3.5" /> Gold-Member</span>
                  )}
                </div>
              </div>
            )}

            {contest.winnerAnnounced && (
              <div className="rounded-xl border border-primary bg-primary/10 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Gewinner</p>
                <p className="font-display text-lg text-foreground">{contest.winnerName || "—"}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {canEnter && (
        <div className="mt-6">
          <ContestEntryForm contest={contest} user={user} onSaved={load} />
        </div>
      )}

      {contest.entriesOpen && st === "ACTIVE" && user && !canEnter && (
        <p className="mt-6 text-xs text-muted-foreground">
          Du hast bereits {myEntries.length} Beitrag/Beiträge eingereicht — mehr ist in dieser Runde nicht möglich.
        </p>
      )}

      <h2 className="font-display text-xl text-foreground mt-8 mb-4">
        Beiträge <span className="text-muted-foreground text-base">({visibleEntries.length})</span>
      </h2>

      {visibleEntries.length === 0 ? (
        <p className="text-muted-foreground text-sm py-8 text-center">Noch keine Beiträge — sei der Erste.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {visibleEntries.map((e) => (
            <ContestEntryCard
              key={e.id}
              entry={e}
              contest={contest}
              currentUser={user}
              votesUsed={votesUsed}
              onVote={votingOpen ? vote : () => {}}
              onAdmin={isAdmin ? adminAction : null}
            />
          ))}
        </div>
      )}
    </div>
  );
}