import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import RequestRanking from "@/components/community/RequestRanking";
import { useRequestVotes } from "@/hooks/useRequestVotes";
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
  { value: "DISCUSSION_TOPIC", label: "Discussion Topic" },
  { value: "SEXUAL_DIRECTION", label: "Sexual Direction" },
];

export default function RequestPage() {
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ type: "VIDEO_IDEA", title: "", description: "", creatorName: "" });
  const { userId, vote } = useRequestVotes();

  useEffect(() => { load(); }, []);

  // Vorbelegung, wenn der Nutzer aus dem Chat heraus das Nachdrehen anfragt.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setForm((prev) => ({
      ...prev,
      type: params.get("type") || prev.type,
      creatorName: params.get("creator") || prev.creatorName,
      title: params.get("title") || prev.title,
    }));
  }, []);
  const load = async () => {
    try {
      const data = await base44.entities.CommunityRequest.list("-votes", 20);
      setRequests(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  // Eine Stimme abgeben oder zurücknehmen — die Rangliste rutscht sofort nach.
  const voteRequest = async (request) => {
    const updated = await vote(request);
    if (updated) setRequests((prev) => prev.map((r) => (r.id === request.id ? updated : r)));
  };

  const submit = async () => {
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      await base44.entities.CommunityRequest.create({
        ...form, votes: 0, status: "NEW",
      });
      toast({ title: "Wunsch eingereicht!", description: "Dein Wunsch steht jetzt auf der Community-Pinnwand." });
      setForm({ type: "VIDEO_IDEA", title: "", description: "", creatorName: "" });
      load();
    } catch (e) {
      toast({ title: "Fehler", description: "Der Wunsch konnte nicht eingereicht werden. Bitte nochmal versuchen.", variant: "destructive" });
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
              <label className="text-xs text-muted-foreground mb-1.5 block">Art</label>
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground focus:outline-none focus:border-primary/50 cursor-pointer">
                {REQUEST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Für Charakter (optional)</label>
              <input type="text" value={form.creatorName} onChange={(e) => setForm({ ...form, creatorName: e.target.value })} placeholder="Artanis, Tania oder Couple" className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Titel</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Kurzer Titel für deinen Wunsch" className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Beschreibung (optional)</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Beschreib deine Idee genauer …" rows={3} className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none" />
          </div>
          <button onClick={submit} disabled={!form.title.trim() || submitting} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 hover:accent-glow transition-all">
            <Send className="w-4 h-4" /> Wunsch einreichen
          </button>
        </div>
      </div>

      <h2 className="font-display text-xl text-foreground mb-1">Rangliste</h2>
      <p className="text-muted-foreground text-sm mb-4">Die Stimmen der Community entscheiden die Reihenfolge.</p>
      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>
      ) : requests.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Noch keine Wünsche — reich den ersten ein.</p>
      ) : (
        <RequestRanking requests={requests} currentUserId={userId} onVote={voteRequest} />
      )}
    </div>
  );
}