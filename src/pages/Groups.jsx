import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import GroupChat from "@/components/GroupChat";
import { Plus, Users } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export default function Groups() {
  const { toast } = useToast();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeGroup, setActiveGroup] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", topicTags: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => { load(); }, []);
  const load = async () => {
    try {
      const data = await base44.entities.ChatGroup.list("-created_date", 30);
      setGroups(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const create = async () => {
    if (!form.title.trim()) return;
    setCreating(true);
    try {
      const user = await base44.auth.me();
      const tags = form.topicTags.split(",").map(s => s.trim()).filter(Boolean);
      const group = await base44.entities.ChatGroup.create({
        title: form.title,
        description: form.description,
        createdById: user.id,
        createdByName: user.full_name || user.email,
        topicTags: tags,
        memberIds: [user.id],
        memberCount: 1,
        lastActivity: new Date().toISOString()
      });
      setForm({ title: "", description: "", topicTags: "" });
      setShowCreate(false);
      load();
      setActiveGroup(group);
    } catch (e) {
      toast({ title: "Error", description: "Could not create group.", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const join = async (group) => {
    try {
      const user = await base44.auth.me();
      if (group.memberIds?.includes(user.id)) {
        setActiveGroup(group);
        return;
      }
      await base44.entities.ChatGroup.update(group.id, {
        memberIds: [...(group.memberIds || []), user.id],
        memberCount: (group.memberCount || 1) + 1
      });
      load();
      setActiveGroup({ ...group, memberIds: [...(group.memberIds || []), user.id] });
    } catch (e) { console.error(e); }
  };

  if (activeGroup) {
    return <GroupChat group={activeGroup} onBack={() => { setActiveGroup(null); load(); }} />;
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-3xl text-foreground">Groups</h1>
          <p className="text-sm text-muted-foreground mt-1">Join like-minded people and share ideas</p>
        </div>
        <button onClick={() => setShowCreate(!showCreate)} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold hover:accent-glow transition-all">
          <Plus className="w-4 h-4" /> New Group
        </button>
      </div>

      {showCreate && (
        <div className="rounded-2xl border border-border bg-card p-6 mb-6 space-y-4">
          <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Group title" className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What's this group about?" rows={2} className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none" />
          <input type="text" value={form.topicTags} onChange={(e) => setForm({ ...form, topicTags: e.target.value })} placeholder="Tags (comma-separated)" className="w-full px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
          <button onClick={create} disabled={!form.title.trim() || creating} className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50">Create Group</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map(g => (
            <button key={g.id} onClick={() => join(g)} className="text-left rounded-2xl border border-border bg-card p-5 hover:border-primary/40 transition-colors">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-display text-lg text-foreground">{g.title}</h3>
                <Users className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{g.description || "No description"}</p>
              {g.topicTags?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {g.topicTags.map((t, i) => <span key={i} className="px-2 py-0.5 rounded-full bg-elevated text-xs text-muted-foreground">{t}</span>)}
                </div>
              )}
              <p className="text-xs text-muted-foreground">{g.memberCount || 0} members · by {g.createdByName || "Unknown"}</p>
            </button>
          ))}
          {groups.length === 0 && <p className="text-muted-foreground col-span-full text-center py-8">No groups yet — create the first one!</p>}
        </div>
      )}
    </div>
  );
}