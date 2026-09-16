import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import RequestCard from "@/components/RequestCard";
import { Send } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const REQUEST_TYPES = [
  { value: "VIDEO_IDEA", label: "Video Idea" },
  { value: "PHOTO_IDEA", label: "Photo Idea" },
  { value: "STORY_IDEA", label: "Story Idea" },
  { value: "LIVE_TOPIC", label: "Live Topic" },
  { value: "INTERACTIVE_IDEA", label: "Interactive Idea" },
  { value: "QUESTION", label: "Question" },
  { value: "CUSTOM_REQUEST", label: "Custom Request" },
];

export default function RequestPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ type: "VIDEO_IDEA", title: "", description: "", creatorName: "" });

  useEffect(() => { load(); }, []);
  const load = async () => {
    try {
      const data = await base44.entities.CommunityRequest.list("-votes", 20);
      setRequests(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const submit = async () => {
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      await base44.entities.CommunityRequest.create({
        ...form, votes: 0, status: "NEW",
      });
      toast({ title: "Request submitted!", description: "Your request has been added to the community board." });
      setForm({ type: "VIDEO_IDEA", title: "", description: "", creatorName: "" });
      load();
    } catch (e) {
      toast({ title: "Error", description: "Could not submit request. Please try again.", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-8">
      <h1 className="font-display text-3xl text-foreground mb-2">Community Requests</h1>
      <p className="text-muted-foreground text-sm mb-8">Submit your ideas and vote on what you'd like to see</p>

      <div className="rounded-2xl border border-border bg-card p-6 mb-8">
        <h2 className="font-display text-xl text-foreground mb-4">Submit a Request</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Type</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground focus:outline-none focus:border-primary/50 cursor-pointer">
                {REQUEST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">For Creator (optional)</label>
              <input type="text" value={form.creatorName} onChange={(e) => setForm({ ...form, creatorName: e.target.value })} placeholder="Artanis, Triania, or Couple" className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Brief title for your request" className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Description (optional)</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe your idea in more detail..." rows={3} className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none" />
          </div>
          <button onClick={submit} disabled={!form.title.trim() || submitting} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 hover:accent-glow transition-all">
            <Send className="w-4 h-4" /> Submit Request
          </button>
        </div>
      </div>

      <h2 className="font-display text-xl text-foreground mb-4">Top Requests</h2>
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {requests.map(r => <RequestCard key={r.id} request={r} />)}
          {requests.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">No requests yet</p>}
        </div>
      )}
    </div>
  );
}