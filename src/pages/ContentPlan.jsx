import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { CalendarRange, Settings2 } from "lucide-react";
import PlanManager from "@/components/studio/PlanManager";

// Der Content-Planer steht überall gleich: dieselbe Anordnung, dieselben Werkzeuge.
// Links die Wünsche, rechts der Plan — so wie im Studio und in der Konsole.
export default function ContentPlan() {
  const [creators, setCreators] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.Creator.list("-created_date")
      .then(setCreators)
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full px-4 lg:px-10 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-4xl text-foreground text-gloss flex items-center gap-3">
            <CalendarRange className="w-8 h-8 text-primary" /> Content-Planer
          </h1>
          <p className="text-[15px] font-semibold text-muted-foreground mt-2 max-w-3xl leading-relaxed">
            Links die Wünsche aus der Community, rechts dein Plan. Übernimm, was du machen willst — und mach daraus mit einem Klick einen Entwurf.
          </p>
        </div>
        <Link
          to="/studio"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-sm font-semibold text-foreground text-gloss"
        >
          <Settings2 className="w-4 h-4" /> Im Studio öffnen
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        <PlanManager creators={creators} />
      )}
    </div>
  );
}