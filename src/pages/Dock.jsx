import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import DockForm from "@/components/dock/DockForm";
import DockCard from "@/components/dock/DockCard";

// Die Dockingstation: hier legt jeder rein, was er mitbringt.
export default function Dock() {
  const [mine, setMine] = useState([]);
  const [approved, setApproved] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const me = await base44.auth.me();
      const [own, live] = await Promise.all([
        base44.entities.Dock.filter({ created_by_id: me.id }, "-created_date", 50),
        base44.entities.Dock.filter({ status: "APPROVED" }, "-created_date", 24),
      ]);
      setMine(own);
      setApproved(live);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-8">
      <div className="mb-6">
        <h1 className="font-display text-3xl text-foreground">Dockingstation</h1>
        <p className="text-muted-foreground text-sm">
          Du hast woanders schon einen Charakter oder ein Modell gebaut? Leg ihn hier rein — wir mischen unsere Persönlichkeit
          dazu und du kannst sofort mit ihm spielen.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DockForm onDone={load} />

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Deine Andockungen ({mine.length})</p>
            {mine.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Noch nichts drin — leg links los.</p>
            ) : (
              <div className="space-y-2">
                {mine.map((d) => <DockCard key={d.id} dock={d} />)}
              </div>
            )}
          </div>

          {approved.length > 0 && (
            <div className="rounded-2xl border border-border bg-card p-5">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Schon an Bord</p>
              <div className="space-y-2">
                {approved.map((d) => <DockCard key={d.id} dock={d} />)}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}