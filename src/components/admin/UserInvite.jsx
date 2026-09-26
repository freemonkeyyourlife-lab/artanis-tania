import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useToast } from "@/components/ui/use-toast";
import { UserPlus, ShieldCheck, User as UserIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const inputCls =
  "flex-1 min-w-0 px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50";

export default function UserInvite() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [sending, setSending] = useState(false);
  const [users, setUsers] = useState([]);

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try { setUsers(await base44.entities.User.list("-created_date", 50)); }
    catch (e) { console.error(e); }
  };

  const invite = async () => {
    const address = email.trim();
    if (!address) return;
    setSending(true);
    try {
      await base44.users.inviteUser(address, role);
      toast({ title: "Einladung verschickt", description: `${address} wurde eingeladen.` });
      setEmail("");
      loadUsers();
    } catch (e) {
      toast({ title: "Fehler", description: "Einladung konnte nicht verschickt werden.", variant: "destructive" });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-5 rounded-2xl border border-border bg-card">
      <h2 className="font-display text-xl text-foreground mb-1">Einladungen & Nutzer</h2>
      <p className="text-muted-foreground text-xs mb-4">Lade Leute ein, damit sie mitchatten, live dabei sind oder eigenen Content hochladen können.</p>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && invite()}
          placeholder="E-Mail-Adresse"
          className={inputCls}
        />
        <select value={role} onChange={(e) => setRole(e.target.value)} className="px-4 py-2.5 rounded-xl bg-elevated border border-border text-sm text-foreground focus:outline-none focus:border-primary/50">
          <option value="user">Nutzer</option>
          <option value="admin">Admin</option>
        </select>
        <button
          onClick={invite}
          disabled={sending || !email.trim()}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-50 whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4" /> {sending ? "Sendet …" : "Einladen"}
        </button>
      </div>

      <div className="mt-5 space-y-2">
        {users.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-4">Noch keine Nutzer</p>
        ) : (
          users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 p-3 rounded-xl bg-elevated">
              <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                {u.role === "admin" ? <ShieldCheck className="w-4 h-4 text-primary" /> : <UserIcon className="w-4 h-4 text-primary" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{u.full_name || u.email}</p>
                <p className="text-xs text-muted-foreground truncate">{u.email}</p>
              </div>
              <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase flex-shrink-0", u.role === "admin" ? "bg-primary text-primary-foreground" : "bg-slate-500/20 text-slate-400")}>
                {u.role || "user"}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}