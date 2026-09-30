import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Crown, Eye, Link2, Power, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { channelLabel, inviteUrl } from "@/lib/invites";

// Alle Einladungen, die du je angelegt hast — mit Auge und Mülleimer hinten dran.
export default function InviteList({ refreshKey = 0 }) {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [refreshKey]);

  const load = async () => {
    try {
      setLinks(await base44.entities.InviteLink.list("-created_date", 100));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const toggle = async (link) => {
    const updated = await base44.entities.InviteLink.update(link.id, { active: link.active === false });
    setLinks((prev) => prev.map((l) => (l.id === link.id ? updated : l)));
  };

  const remove = async (link) => {
    if (!window.confirm(`Einladung "${link.label || "Einladung"}" wirklich löschen?`)) return;
    await base44.entities.InviteLink.delete(link.id);
    setLinks((prev) => prev.filter((l) => l.id !== link.id));
  };

  if (loading) return null;

  return (
    <div className="glass rounded-2xl border border-border p-5">
      <p className="font-display text-xl text-foreground mb-1">Deine Einladungen</p>
      <p className="text-[15px] font-semibold text-muted-foreground mb-4">
        Jede Zeile ist eine Einladung. Das Auge öffnet sie, das Mülleimer-Symbol löscht sie.
      </p>

      {links.length === 0 ? (
        <p className="text-[15px] font-semibold text-muted-foreground text-center py-6">Noch keine Einladung angelegt.</p>
      ) : (
        <div className="space-y-2">
          {links.map((link) => (
            <div key={link.id} className={cn("flex items-center gap-3 p-3 rounded-xl bg-elevated", link.active === false && "opacity-50")}>
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0", link.grantStatus === "GOLD" ? "bg-primary/15 text-primary" : "bg-slate-500/20 text-slate-400")}>
                {link.grantStatus === "GOLD" ? <Crown className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-bold text-foreground truncate">{link.label || "Einladung"}</p>
                <p className="text-[13px] font-semibold text-muted-foreground truncate">
                  {channelLabel(link.channel)} · {link.grantStatus === "GOLD" ? "alles frei" : "normal"} · {link.useCount || 0} genutzt
                  {link.maxUses ? ` von ${link.maxUses}` : ""}
                  {link.code ? ` · Code ${link.code}` : ""}
                </p>
              </div>
              <a
                href={inviteUrl(link.token)}
                target="_blank"
                rel="noreferrer"
                title="Anschauen"
                className="w-9 h-9 rounded-full glass-btn flex items-center justify-center text-muted-foreground hover:text-primary flex-shrink-0"
              >
                <Eye className="w-4 h-4" />
              </a>
              <button
                onClick={() => toggle(link)}
                title={link.active === false ? "Wieder einschalten" : "Ausschalten"}
                className={cn("w-9 h-9 rounded-full glass-btn flex items-center justify-center flex-shrink-0", link.active === false ? "text-destructive" : "text-emerald-400")}
              >
                <Power className="w-4 h-4" />
              </button>
              <button
                onClick={() => remove(link)}
                title="Löschen"
                className="w-9 h-9 rounded-full bg-destructive/15 text-destructive flex items-center justify-center hover:bg-destructive/25 flex-shrink-0"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}