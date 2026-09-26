import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Link } from "react-router-dom";
import { Radio, Upload, FileText, Sparkles, MessageSquare, Inbox, TrendingUp, Users, ArrowBigUp } from "lucide-react";
import StatusBadge from "@/components/StatusBadge";
import UserInvite from "@/components/admin/UserInvite";
import PurchaseRequests from "@/components/admin/PurchaseRequests";
import CreatorToggleList from "@/components/admin/CreatorToggleList";
import { cn } from "@/lib/utils";

export default function Admin() {
  const [creators, setCreators] = useState([]);
  const [content, setContent] = useState([]);
  const [requests, setRequests] = useState([]);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [c, cont, req, t] = await Promise.all([
        base44.entities.Creator.list(),
        base44.entities.Content.list(),
        base44.entities.CommunityRequest.list("-votes", 20),
        base44.entities.Topic.list(),
      ]);
      setCreators(c);
      setContent(cont);
      setRequests(req);
      setTopics(t);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const artanis = creators.find(c => c.personaType === "SOLO_MALE");
  const triania = creators.find(c => c.personaType === "SOLO_FEMALE");

  const toggleStatus = async (creator, newStatus) => {
    try {
      await base44.entities.Creator.update(creator.id, { onlineStatus: newStatus });
      loadData();
    } catch (e) { console.error(e); }
  };

  const stats = [
    { label: "Total Content", value: content.length, icon: Radio },
    { label: "Active Requests", value: requests.length, icon: Inbox },
    { label: "Topics", value: topics.length, icon: TrendingUp },
    { label: "Creators", value: creators.length, icon: Users },
  ];

  const quickActions = [
    { label: "Go Live", icon: Radio, color: "bg-red-500/20 text-red-400", to: "/live" },
    { label: "Create Room", icon: Radio, color: "bg-primary/20 text-primary", to: "/call" },
    { label: "Upload", icon: Upload, color: "bg-blue-500/20 text-blue-400", to: "/studio" },
    { label: "New Story", icon: FileText, color: "bg-emerald-500/20 text-emerald-400", to: "/studio" },
    { label: "New Experience", icon: Sparkles, color: "bg-violet-500/20 text-violet-400", to: "/interactive" },
    { label: "View Requests", icon: Inbox, color: "bg-amber-500/20 text-amber-400", to: "/request" },
    { label: "Messages", icon: MessageSquare, color: "bg-cyan-500/20 text-cyan-400", to: "/messages" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-8">
      <h1 className="font-display text-3xl text-foreground mb-2">Admin Dashboard</h1>
      <p className="text-muted-foreground text-sm mb-8">Manage creators, content, and platform activity</p>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3 mb-8">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link key={action.label} to={action.to} className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-border bg-card hover:border-primary/30 transition-colors">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", action.color)}>
                <Icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-medium text-foreground text-center">{action.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="p-5 rounded-2xl border border-border bg-card">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <Icon className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="font-display text-3xl text-foreground">{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Creator Status */}
        <div className="p-5 rounded-2xl border border-border bg-card">
          <h2 className="font-display text-xl text-foreground mb-4">Creator Status</h2>
          <div className="space-y-4">
            {artanis && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-elevated">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-display text-primary">A</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{artanis.stageName}</p>
                    <div className="mt-1"><StatusBadge status={artanis.onlineStatus} /></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleStatus(artanis, "ONLINE")} className="px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors">Online</button>
                  <button onClick={() => toggleStatus(artanis, "OFFLINE")} className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-500/20 text-slate-400 hover:bg-slate-500/30 transition-colors">Offline</button>
                </div>
              </div>
            )}
            {triania && (
              <div className="flex items-center justify-between p-4 rounded-xl bg-elevated">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-display text-primary">T</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{triania.stageName}</p>
                    <div className="mt-1"><StatusBadge status={triania.onlineStatus} /></div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleStatus(triania, "ONLINE")} className="px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors">Online</button>
                  <button onClick={() => toggleStatus(triania, "OFFLINE")} className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-500/20 text-slate-400 hover:bg-slate-500/30 transition-colors">Offline</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Trending Topics */}
        <div className="p-5 rounded-2xl border border-border bg-card">
          <h2 className="font-display text-xl text-foreground mb-4">Trending Topics</h2>
          <div className="flex flex-wrap gap-2">
            {topics.map((t) => (
              <span key={t.id} className="px-3 py-1.5 rounded-full glass border border-border text-xs text-muted-foreground">
                {t.name}
              </span>
            ))}
          </div>
        </div>

        {/* Recent Requests */}
        <div className="p-5 rounded-2xl border border-border bg-card lg:col-span-2">
          <h2 className="font-display text-xl text-foreground mb-4">Recent Community Requests</h2>
          <div className="space-y-2">
            {requests.slice(0, 8).map((req) => (
              <div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-elevated">
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-primary">{req.type.replace(/_/g, " ")}</span>
                  <p className="text-sm text-foreground truncate">{req.title}</p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="flex items-center gap-1 text-sm text-muted-foreground">
                    <ArrowBigUp className="w-4 h-4" /> {req.votes || 0}
                  </span>
                  <span className={cn("px-2 py-1 rounded-full text-[11px] font-medium", req.status === "NEW" ? "bg-amber-500/20 text-amber-400" : "bg-slate-500/20 text-slate-400")}>
                    {req.status}
                  </span>
                </div>
              </div>
            ))}
            {requests.length === 0 && <p className="text-muted-foreground text-center py-8">No requests yet</p>}
          </div>
        </div>

        {/* Charaktere: an/aus & Stil */}
        <div className="p-5 rounded-2xl border border-border bg-card lg:col-span-2">
          <h2 className="font-display text-xl text-foreground mb-1">Charaktere</h2>
          <p className="text-xs text-muted-foreground mb-4">
            „Deaktivieren" nimmt jemanden aus der App, „Animiert" schaltet zwischen Foto und gezeichneter Figur.
          </p>
          <CreatorToggleList creators={creators} onChanged={loadData} />
        </div>

        {/* Users & Invites */}
        <div className="lg:col-span-2">
          <UserInvite />
        </div>

        {/* Pending payments */}
        <div className="lg:col-span-2">
          <PurchaseRequests />
        </div>
      </div>
    </div>
  );
}