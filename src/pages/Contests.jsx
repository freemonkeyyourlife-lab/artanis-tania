import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { cn } from "@/lib/utils";
import { Trophy } from "lucide-react";
import ContestCard from "@/components/contests/ContestCard";
import { statusOf } from "@/lib/contests";

const FILTERS = [
  { id: "all", label: "Alle" },
  { id: "ACTIVE", label: "Läuft" },
  { id: "VOTING", label: "Abstimmung" },
  { id: "ENDED", label: "Beendet" },
];

export default function Contests() {
  const [contests, setContests] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => { load(); }, []);
  const load = async () => {
    try {
      const data = await base44.entities.Contest.filter({ published: true }, "-created_date", 50);
      setContests(data);
      const entries = await base44.entities.ContestEntry.list("-created_date", 500);
      const map = {};
      entries.forEach((e) => { map[e.contestId] = (map[e.contestId] || 0) + 1; });
      setCounts(map);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const visible = contests
    .filter((c) => filter === "all" || statusOf(c) === filter)
    .sort((a, b) => {
      if (!!b.featured !== !!a.featured) return b.featured ? 1 : -1;
      const rank = (c) => (statusOf(c) === "ACTIVE" ? 0 : statusOf(c) === "VOTING" ? 1 : statusOf(c) === "UPCOMING" ? 2 : 3);
      return rank(a) - rank(b);
    });

  if (loading) {
    return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-foreground flex items-center gap-2">
          <Trophy className="w-7 h-7 text-primary" /> Wettbewerbe
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Wöchentliche und monatliche Challenges — mach mit, stimme ab, gewinne.
        </p>
      </div>

      <div className="flex gap-1 p-1 rounded-full bg-elevated border border-border w-fit mb-6 overflow-x-auto scrollbar-hide">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={cn("px-5 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors", filter === f.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="text-center py-20">
          <Trophy className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
          <p className="text-muted-foreground">Hier läuft gerade kein Wettbewerb — schau bald wieder rein.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {visible.map((c) => (
            <ContestCard key={c.id} contest={c} entryCount={counts[c.id] || 0} />
          ))}
        </div>
      )}
    </div>
  );
}