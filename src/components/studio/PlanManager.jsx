import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Inbox, ArrowRight, GripVertical } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import PlanRequestCard from "@/components/studio/PlanRequestCard";
import PlanItemCard from "@/components/studio/PlanItemCard";
import PlanPipeline from "@/components/plan/PlanPipeline";
import PublishTimeline from "@/components/plan/PublishTimeline";
import PlanDropZone from "@/components/plan/PlanDropZone";
import { cn } from "@/lib/utils";
import {
  OPEN_REQUEST_STATUSES,
  PLAN_STATUSES,
  contentTypeForPlan,
  planTypeForRequest,
} from "@/lib/contentPlan";
import { requestStatusForPlan, WORKING_REQUEST_STATUSES } from "@/lib/planSync";

const rows = (r) => (Array.isArray(r) ? r : r?.items || []);

// Community-Wünsche in den Content-Plan ziehen und dort bis zur Veröffentlichung verfolgen.
export default function PlanManager({ creators = [] }) {
  const [requests, setRequests] = useState([]);
  const [plans, setPlans] = useState([]);
  const [counts, setCounts] = useState({});
  const [schedule, setSchedule] = useState([]);
  const [requestTitles, setRequestTitles] = useState({});
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState([]);
  const [onlyMarked, setOnlyMarked] = useState(false);
  const [busyAdopt, setBusyAdopt] = useState(false);
  const { toast } = useToast();

  useEffect(() => { load(); }, [statusFilter]);

  const load = async () => {
    const [reqs, items, agg, upcoming, working] = await Promise.all([
      base44.entities.CommunityRequest.filter({ status: { $in: OPEN_REQUEST_STATUSES } }, "-votes", 200),
      base44.entities.ContentPlan.filter(statusFilter ? { status: statusFilter } : {}, "-created_date", 200),
      base44.entities.ContentPlan.aggregate({ groupBy: "status" }).catch(() => ({ rows: [] })),
      base44.entities.ContentPlan.filter(
        { scheduledAt: { $exists: true, $ne: null }, status: { $ne: "PUBLISHED" } },
        "scheduledAt",
        20
      ),
      base44.entities.CommunityRequest.filter({ status: { $in: WORKING_REQUEST_STATUSES } }, "-updated_date", 200),
    ]);
    setRequests(rows(reqs));
    setPlans(
      rows(items).sort(
        (a, b) =>
          PLAN_STATUSES.findIndex((s) => s.value === a.status) - PLAN_STATUSES.findIndex((s) => s.value === b.status)
      )
    );
    setCounts(Object.fromEntries((agg?.rows || []).map((r) => [r.status || "IDEA", r.count])));
    setSchedule(rows(upcoming).filter((p) => p.scheduledAt));
    setRequestTitles(Object.fromEntries(rows(working).map((r) => [r.id, r.title])));
    setLoading(false);
  };

  const createFromRequest = (r, values = {}) => ({
    creatorId: values.creatorId ?? r.creatorId ?? "",
    requestId: r.id,
    title: values.title?.trim() || r.title,
    type: values.type || planTypeForRequest(r.type),
    status: "PLANNED",
    description: values.note ?? r.description ?? "",
    topics: r.topics || [],
  });

  const adopt = async (request, values) => {
    const data = createFromRequest(request, values);
    await base44.entities.ContentPlan.create(data);
    await base44.entities.CommunityRequest.update(request.id, { status: "PLANNED" });
    const creator = creators.find((c) => c.id === data.creatorId);
    toast({ title: "Im Content-Plan", description: `"${data.title}" ist übernommen${creator ? ` — ${creator.stageName}` : ""}.` });
    load();
  };

  const adoptSelected = async () => {
    const picked = requests.filter((r) => selectedIds.includes(r.id));
    if (!picked.length) return;
    setBusyAdopt(true);
    try {
      await base44.entities.ContentPlan.bulkCreate(picked.map((r) => createFromRequest(r)));
      await base44.entities.CommunityRequest.bulkUpdate(picked.map((r) => ({ id: r.id, status: "PLANNED" })));
      setSelectedIds([]);
      toast({ title: `${picked.length} Wünsche übernommen`, description: "Sie stehen jetzt in deinem Content-Plan." });
      load();
    } finally {
      setBusyAdopt(false);
    }
  };

  // Wunsch von links in den Plan ziehen.
  const onDragEnd = ({ draggableId, destination }) => {
    if (destination?.droppableId !== "plan") return;
    const r = requests.find((x) => x.id === draggableId);
    if (!r) return;
    setRequests((prev) => prev.filter((x) => x.id !== r.id));
    adopt(r, {});
  };

  const mark = async (request, status) => {
    setRequests((prev) => prev.map((r) => (r.id === request.id ? { ...r, status } : r)));
    await base44.entities.CommunityRequest.update(request.id, { status });
  };

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
    await base44.entities.ContentPlan.update(item.id, { status: "READY", contentId: content.id });
    if (item.requestId) await base44.entities.CommunityRequest.update(item.requestId, { status: requestStatusForPlan("READY") });
    toast({ title: "Post angelegt", description: `"${item.title}" liegt unter „Preise & Content" als Entwurf bereit.` });
    load();
  };

  // Status weiterziehen — der verknüpfte Wunsch zieht mit, ein veröffentlichter Post geht live.
  const setStatus = async (item, status) => {
    setPlans((prev) => prev.map((p) => (p.id === item.id ? { ...p, status } : p)));
    await base44.entities.ContentPlan.update(item.id, { status });
    if (item.requestId) await base44.entities.CommunityRequest.update(item.requestId, { status: requestStatusForPlan(status) });
    if (status === "PUBLISHED" && item.contentId) await base44.entities.Content.update(item.contentId, { published: true });
    load();
  };

  const setDate = async (item, scheduledAt) => {
    setPlans((prev) => prev.map((p) => (p.id === item.id ? { ...p, scheduledAt } : p)));
    await base44.entities.ContentPlan.update(item.id, { scheduledAt });
    load();
  };

  const remove = async (item) => {
    if (!window.confirm(`"${item.title}" aus dem Plan nehmen?`)) return;
    await base44.entities.ContentPlan.delete(item.id);
    if (item.requestId) await base44.entities.CommunityRequest.update(item.requestId, { status: "REVIEWED" });
    load();
  };

  const visibleRequests = onlyMarked ? requests.filter((r) => r.status === "REVIEWED") : requests;
  const allSelected = visibleRequests.length > 0 && visibleRequests.every((r) => selectedIds.includes(r.id));
  const toggleSelect = (id) => setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  const toggleAll = () => setSelectedIds(allSelected ? [] : visibleRequests.map((r) => r.id));
  const inWork = plans.filter((p) => p.requestId && p.status !== "PUBLISHED").length;

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <PlanPipeline counts={counts} active={statusFilter} onPick={setStatusFilter} />

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass rounded-2xl border border-border p-5">
            <h2 className="font-display text-xl text-foreground mb-1">Wünsche aus der Community</h2>
            <p className="text-xs text-muted-foreground mb-4">
              Beliebte oben. Am Griff nach rechts in den Plan ziehen — oder mehrere auswählen und übernehmen.
            </p>

            <div className="flex flex-wrap items-center gap-2 mb-4">
              <button
                onClick={() => setOnlyMarked((v) => !v)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-[11px] font-semibold border transition-colors",
                  onlyMarked ? "bg-primary/15 border-primary/40 text-primary" : "bg-background border-border text-muted-foreground"
                )}
              >
                Nur gemerkte
              </button>
              <button onClick={toggleAll} className="px-3 py-1.5 rounded-full bg-background border border-border text-[11px] font-medium text-muted-foreground hover:text-foreground">
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

            <Droppable droppableId="requests" isDropDisabled>
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                  {visibleRequests.length === 0 && (
                    <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                      <Inbox className="w-6 h-6" />
                      <p className="text-sm">{onlyMarked ? "Noch nichts gemerkt." : "Gerade keine offenen Wünsche."}</p>
                    </div>
                  )}
                  {visibleRequests.map((r, i) => (
                    <Draggable key={r.id} draggableId={r.id} index={i}>
                      {(drag, snap) => (
                        <div ref={drag.innerRef} {...drag.draggableProps} className={cn("flex gap-2", snap.isDragging && "opacity-90")}>
                          <div {...drag.dragHandleProps} title="In den Plan ziehen" className="pt-4 text-muted-foreground hover:text-primary cursor-grab">
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <PlanRequestCard
                              request={r}
                              creators={creators}
                              selected={selectedIds.includes(r.id)}
                              onToggleSelect={toggleSelect}
                              onMark={mark}
                              onAdopt={(values) => adopt(r, values)}
                            />
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </div>

          <div className="space-y-6">
            <div className="glass rounded-2xl border border-border p-5">
              <h2 className="font-display text-xl text-foreground mb-1">Dein Content-Plan</h2>
              <p className="text-xs text-muted-foreground mb-3">
                {plans.length} {plans.length === 1 ? "Eintrag" : "Einträge"}
                {statusFilter ? ` in dieser Stufe` : ""} · {inWork} Wünsche in Arbeit
              </p>
              <PlanDropZone>
                {plans.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-10 text-center">Noch nichts hier — zieh links einen Wunsch herüber.</p>
                ) : (
                  <div className="space-y-2">
                    {plans.map((p) => (
                      <PlanItemCard
                        key={p.id}
                        item={p}
                        creatorName={creators.find((c) => c.id === p.creatorId)?.stageName}
                        requestTitle={requestTitles[p.requestId]}
                        onStatus={(status) => setStatus(p, status)}
                        onSchedule={(date) => setDate(p, date)}
                        onRemove={() => remove(p)}
                        onMakePost={makePost}
                      />
                    ))}
                  </div>
                )}
              </PlanDropZone>
            </div>

            <PublishTimeline items={schedule} creators={creators} />
          </div>
        </div>
      </DragDropContext>
    </div>
  );
}