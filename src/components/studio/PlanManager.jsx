import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Inbox, ArrowRight } from "lucide-react";
import PlanRequestCard from "@/components/studio/PlanRequestCard";
import PlanItemCard from "@/components/studio/PlanItemCard";
import { cn } from "@/lib/utils";
import {
  OPEN_REQUEST_STATUSES,
  PLAN_STATUSES,
  contentTypeForPlan,
  planTypeForRequest,
} from "@/lib/contentPlan";

// Community-Wünsche in den Content-Plan übernehmen und dort weiterverfolgen.
export default function PlanManager({ creators = [] }) {
  const [requests, setRequests] = useState([]);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [onlyMarked, setOnlyMarked] = useState(false);
  const [busyAdopt, setBusyAdopt] = useState(false);
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

  // Mehrere ausgewählte Wünsche in einem Schritt in den Plan überführen.
  const adoptSelected = async () => {
    const picked = requests.filter((r) => selectedIds.includes(r.id));
    if (!picked.length) return;
    setBusyAdopt(true);
    try {
      await base44.entities.ContentPlan.bulkCreate(
        picked.map((r) => ({
          creatorId: r.creatorId || "",
          requestId: r.id,
          title: r.title,
          type: planTypeForRequest(r.type),
          status: "PLANNED",
          description: r.description || "",
          topics: r.topics || [],
        }))
      );
      await base44.entities.CommunityRequest.bulkUpdate(
        picked.map((r) => ({ id: r.id, status: "PLANNED" }))
      );
      setSelectedIds([]);
      toast({
        title: `${picked.length} Wünsche übernommen`,
        description: "Sie stehen jetzt in deinem Content-Plan.",
      });
      load();
    } finally {
      setBusyAdopt(false);
    }
  };

  // Wunsch markieren (bleibt sichtbar) oder verwerfen.
  const mark = async (request, status) => {
    setRequests((prev) => prev.map((r) => (r.id === request.id ? { ...r, status } : r)));
    await base44.entities.CommunityRequest.update(request.id, { status });
  };

  // Aus einem Plan-Eintrag einen fertigen Post (Entwurf) machen.
  const makePost = async (item) => {
    const creator = creators.find((c) => c.id === item.creatorId);
    const content = await base44.entities.Content.create({
      creatorId: item.creatorId || "",
      creatorName: creator?.stageName || "",
      title: item.title,
      description: item.description || "",
      contentType: contentTypeForPlan(item.type),
      topics: item.topics || [],
      visibility: "REGISTERED",
      isFree: true,
      published: false,
      ageRestricted: true,
    });
    setPlans((prev) => prev.map((p) => (p.id === item.id ? { ...p, status: "READY", contentId: content.id } : p)));
    await base44.entities.ContentPlan.update(item.id, { status: "READY", contentId: content.id });
    toast({
      title: "Post angelegt",
      description: `"${item.title}" liegt unter „Preise & Content" als Entwurf bereit.`,
    });
  };

  const visibleRequests = onlyMarked ? requests.filter((r) => r.status === "REVIEWED") : requests;
  const allSelected = visibleRequests.length > 0 && visibleRequests.every((r) => selectedIds.includes(r.id));
  const toggleSelect = (id) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleAll = () => setSelectedIds(allSelected ? [] : visibleRequests.map((r) => r.id));

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
      <div className="glass rounded-2xl border border-border p-5">
        <h2 className="font-display text-xl text-foreground mb-1">Wünsche aus der Community</h2>
        <p className="text-xs text-muted-foreground mb-4">
          Beliebte oben. Merken, was du machen willst — einzeln oder mehrere auf einmal in den Plan.
        </p>

        <div className="flex items-center gap-2 mb-4">
          <button
            onClick={() => setOnlyMarked((v) => !v)}
            className={cn(
              "px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors",
              onlyMarked
                ? "bg-primary/15 border-primary/40 text-primary"
                : "bg-background border-border text-muted-foreground"
            )}
          >
            Nur gemerkte
          </button>
          <button
            onClick={toggleAll}
            className="px-3 py-1.5 rounded-full bg-background border border-border text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {allSelected ? "Auswahl aufheben" : "Alle auswählen"}
          </button>
          <button
            onClick={adoptSelected}
            disabled={!selectedIds.length || busyAdopt}
            className="ml-auto inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-primary-foreground text-xs font-semibold disabled:opacity-40"
          >
            {busyAdopt ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
            Übernehmen ({selectedIds.length})
          </button>
        </div>

        {visibleRequests.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
            <Inbox className="w-6 h-6" />
            <p className="text-sm">{onlyMarked ? "Noch nichts gemerkt." : "Gerade keine offenen Wünsche."}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleRequests.map((r) => (
              <PlanRequestCard
                key={r.id}
                request={r}
                creators={creators}
                selected={selectedIds.includes(r.id)}
                onToggleSelect={toggleSelect}
                onMark={mark}
                onAdopt={(values) => adopt(r, values)}
              />
            ))}
          </div>
        )}
      </div>

      <div className="glass rounded-2xl border border-border p-5">
        <h2 className="font-display text-xl text-foreground mb-1">Dein Content-Plan</h2>
        <p className="text-xs text-muted-foreground mb-5">
          {plans.length} {plans.length === 1 ? "Eintrag" : "Einträge"} — Status weiterziehen und mit einem Klick einen Post anlegen.
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
                onMakePost={makePost}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}