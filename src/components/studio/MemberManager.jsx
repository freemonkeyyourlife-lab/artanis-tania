import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { Crown, Link2, Plus, Copy, Trash2, Power } from "lucide-react";
import { cn } from "@/lib/utils";

const inputCls =
  "w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 appearance-none";

function makeToken() {
  const alphabet = "abcdefghijkmnpqrstuvwxyz23456789";
  return Array.from({ length: 12 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

export default function MemberManager() {
  const { toast } = useToast();
  const [users, setUsers] = useState([]);
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ label: "", grantStatus: "GOLD", maxUses: 0 });
  const [creating, setCreating] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const [userList, linkList] = await Promise.all([
        base44.entities.User.list("-created_date", 100),
        base44.entities.InviteLink.list("-created_date", 100),
      ]);
      setUsers(userList);
      setLinks(linkList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const setStatus = async (user, memberStatus) => {
    try {
      await base44.entities.User.update(user.id, { memberStatus });
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, memberStatus } : u)));
      toast({
        title: memberStatus === "GOLD" ? "Gold Member gesetzt" : "Status zurückgesetzt",
        description: user.full_name || user.email,
      });
    } catch (e) {
      toast({ title: "Fehler", description: "Status konnte nicht geändert werden.", variant: "destructive" });
    }
  };

  const createLink = async () => {
    setCreating(true);
    try {
      const me = await base44.auth.me();
      const created = await base44.entities.InviteLink.create({
        token: makeToken(),
        creatorId: me.id,
        targetType: "VIP",
        channel: "PLATFORM",
        active: true,
        label: form.label || "Einladung",
        grantStatus: form.grantStatus,
        maxUses: Number(form.maxUses) || 0,
        useCount: 0,
        claimedBy: [],
        clickCount: 0,
        registrationCount: 0,
        purchaseCount: 0,
        revenueAttributed: 0,
      });
      setLinks((prev) => [created, ...prev]);
      setForm({ label: "", grantStatus: "GOLD", maxUses: 0 });
      toast({ title: "Link erstellt", description: "Kopiere ihn und schick ihn weiter." });
    } catch (e) {
      console.error(e);
      toast({ title: "Fehler", description: "Link konnte nicht erstellt werden.", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const toggleLink = async (link) => {
    const updated = await base44.entities.InviteLink.update(link.id, { active: link.active === false });
    setLinks((prev) => prev.map((l) => (l.id === link.id ? updated : l)));
  };

  const removeLink = async (link) => {
    if (!window.confirm("Diesen Einladungslink löschen?")) return;
    await base44.entities.InviteLink.delete(link.id);
    setLinks((prev) => prev.filter((l) => l.id !== link.id));
  };

  const copy = (link) => {
    navigator.clipboard.writeText(`${window.location.origin}/?invite=${link.token}`);
    toast({ title: "Link kopiert" });
  };

  if (loading) {
    return <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-8">
      <div className="p-5 rounded-2xl border border-border bg-card">
        <h2 className="font-display text-xl text-foreground mb-1">Einladungslinks</h2>
        <p className="text-muted-foreground text-xs mb-4">
          Wer sich über so einen Link anmeldet, bekommt automatisch den Status — Gold heißt: alles umsonst, für immer.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          <input value={form.label} onChange={(e) => setForm((p) => ({ ...p, label: e.target.value }))} placeholder="Für wen? z. B. Julia" className={inputCls} />
          <select value={form.grantStatus} onChange={(e) => setForm((p) => ({ ...p, grantStatus: e.target.value }))} className={inputCls}>
            <option value="GOLD">Gold Member — alles frei</option>
            <option value="STANDARD">Standard</option>
          </select>
          <input type="number" min="0" value={form.maxUses} onChange={(e) => setForm((p) => ({ ...p, maxUses: e.target.value }))} placeholder="Max. Nutzungen (0 = unbegrenzt)" className={inputCls} />
        </div>

        <button
          onClick={createLink}
          disabled={creating}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> {creating ? "Erstelle …" : "Link erstellen"}
        </button>

        <div className="mt-5 space-y-2">
          {links.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">Noch keine Links</p>
          ) : (
            links.map((link) => (
              <div key={link.id} className={cn("p-3 rounded-xl bg-elevated flex items-center gap-3", link.active === false && "opacity-50")}>
                <div className={cn("w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0", link.grantStatus === "GOLD" ? "bg-primary/15 text-primary" : "bg-slate-500/20 text-slate-400")}>
                  {link.grantStatus === "GOLD" ? <Crown className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{link.label || "Einladung"}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {link.grantStatus || "GOLD"} · {link.useCount || 0} genutzt{link.maxUses ? ` von ${link.maxUses}` : ""} · {link.token}
                  </p>
                </div>
                <button onClick={() => copy(link)} title="Link kopieren" className="w-8 h-8 rounded-full bg-background border border-border text-muted-foreground flex items-center justify-center hover:text-foreground transition-colors flex-shrink-0">
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => toggleLink(link)} title={link.active === false ? "Aktivieren" : "Deaktivieren"} className="w-8 h-8 rounded-full bg-background border border-border text-muted-foreground flex items-center justify-center hover:text-foreground transition-colors flex-shrink-0">
                  <Power className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => removeLink(link)} className="w-8 h-8 rounded-full bg-destructive/15 text-destructive flex items-center justify-center hover:bg-destructive/25 transition-colors flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="p-5 rounded-2xl border border-border bg-card">
        <h2 className="font-display text-xl text-foreground mb-1">Status vergeben</h2>
        <p className="text-muted-foreground text-xs mb-4">Du bestimmst, wer Gold Member ist und alles umsonst bekommt.</p>

        <div className="space-y-2">
          {users.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">Noch keine Nutzer</p>
          ) : (
            users.map((u) => {
              const gold = u.memberStatus === "GOLD";
              return (
                <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-elevated">
                  <div className={cn("w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0", gold ? "bg-primary/15 text-primary" : "bg-slate-500/20 text-slate-400")}>
                    <Crown className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{u.full_name || u.email}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{u.email} · {u.role || "user"}</p>
                  </div>
                  <button
                    onClick={() => setStatus(u, gold ? "STANDARD" : "GOLD")}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wider flex-shrink-0 transition-colors",
                      gold ? "bg-primary text-primary-foreground" : "bg-background border border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {gold ? "Gold" : "Standard"}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}