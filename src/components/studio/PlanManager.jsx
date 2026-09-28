import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Inbox } from "lucide-react";
import PlanRequestCard from "@/components/studio/PlanRequestCard";
import PlanItemCard from "@/components/studio/PlanItemCard";
import { OPEN_REQUEST_STATUSES, PLAN_STATUSES } from "@/lib/contentPlan";

// Community-Wünsche in den Content-Plan übernehmen und dort weiterverfolgen.
export default function PlanManager({ creators = [] }) {
  const [requests, setRequests] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [reqs, items] = await Promise.all([
        base44.entities.CommunityRequest.list("-created_date", 200),
        base44.entities.ContentPlan.list("-created_date", 200),
      ]);
      setRequests(
        reqs
          .filter((r) => OPEN_REQUEST_STATUSES.includes(r.status || "NEW"))
          .sort((a, b) => (b.votes || 0) - (a.votes || 0))
      );
      setPlans(
        items.sort(
          (a, b) =>
            PLAN_STATUSES.findIndex((s) => s.value === a.status) -
            PLAN_STATUSES.findIndex((s) => s.value === b.status)
        )
      );
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const adopt = async (request, values) => {
    const title = values.title.trim() || request.title;
    const creator = creators.find((c) => c.id === values.creatorId);
    await base44.entities.ContentPlan.create({
      creatorId: values.creatorId || "",
      requestId: request.id,
      title,
      type: values.type,
      status: "PLANNED",
      description: values.note,
      topics: request.topics || [],
    });
    await base44.entities.CommunityRequest.update(request.id, { status: "PLANNED" });
    toast({
      title: "Im Content-Plan",
      description: `"${title}" ist übernommen${creator ? ` — ${creator.stageName}` : ""}.`,
    });
    load();
  };

  const setStatus = async (item, status) => {
    setPlans((prev) => prev.map((p) => (p.id === item.id ? { ...p, status } : p)));
    await base44.entities.ContentPlan.update(item.id, { status });
  };

  const remove = async (item) => {
    if (!window.confirm(`"${item.title}" aus dem Plan nehmen?`)) return;
    await base44.entities.ContentPlan.delete(item.id);
    load();
  };

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-xl text-foreground mb-1">Wünsche aus der Community</h2>
        <p className="text-xs text-muted-foreground mb-5">
          Die beliebtesten oben. Ein Klick genügt — Titel, Art und Notiz sind schon vorbelegt.
        </p>

        {requests.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <Inbox className="w-6 h-6" />
            <p className="text-sm">Gerade keine offenen Wünsche.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((r) => (
              <PlanRequestCard key={r.id} request={r} creators={creators} onAdopt={(values) => adopt(r, values)} />
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="font-display text-xl text-foreground mb-1">Dein Content-Plan</h2>
        <p className="text-xs text-muted-foreground mb-5">
          {plans.length} {plans.length === 1 ? "Eintrag" : "Einträge"} — Status direkt hier weiterziehen.
        </p>

        {plans.length === 0 ? (
          <p className="text-sm text-muted-foreground py-12 text-center">
            Noch nichts geplant — übernimm links einen Wunsch.
          </p>
        ) : (
          <div className="space-y-2">
            {plans.map((p) => (
              <PlanItemCard
                key={p.id}
                item={p}
                creatorName={creators.find((c) => c.id === p.creatorId)?.stageName}
                onStatus={(status) => setStatus(p, status)}
                onRemove={() => remove(p)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}