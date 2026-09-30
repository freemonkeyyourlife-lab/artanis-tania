import React, { useState, useEffect } from "react";
import { Check, Eye, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { addTestUser, getViewAs, removeTestUser, setViewAs, subscribeViewAs, testUsers } from "@/lib/viewAs";

const input =
  "flex-1 px-4 py-3 rounded-xl bg-background border border-border text-[15px] font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50";

// Ein Klick und du bist jemand anderes: so siehst du sofort, was ein normaler
// Nutzer sieht und was ein Goldnutzer sieht. Zurück geht es oben in der Kopfzeile.
export default function UserSwitcher({ me }) {
  const [users, setUsers] = useState(testUsers);
  const [current, setCurrent] = useState(getViewAs);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("STANDARD");

  useEffect(
    () =>
      subscribeViewAs(() => {
        setUsers(testUsers());
        setCurrent(getViewAs());
      }),
    []
  );

  const add = () => {
    if (!name.trim()) return;
    const created = addTestUser(name, status);
    setName("");
    setViewAs(created);
  };

  return (
    <div className="glass rounded-2xl border border-border p-5">
      <p className="font-display text-xl text-foreground mb-1">Blick als Nutzer</p>
      <p className="text-[15px] font-semibold text-muted-foreground mb-4">
        Schalte hin und her und sieh, wie die App für einen anderen aussieht. Du bist dabei immer noch du — es ist nur die Ansicht.
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
        <button
          onClick={() => setViewAs(null)}
          className={cn(
            "flex items-center gap-2 px-4 py-3 rounded-xl border text-[14px] font-bold text-left transition-colors",
            !current ? "border-primary bg-primary/10 text-foreground" : "border-border bg-elevated text-muted-foreground hover:text-foreground"
          )}
        >
          {!current ? <Check className="w-4 h-4 text-primary flex-shrink-0" /> : <Eye className="w-4 h-4 flex-shrink-0" />}
          <span className="truncate">Ich selbst{me?.full_name ? ` · ${me.full_name}` : ""}</span>
        </button>

        {users.map((u) => {
          const active = current?.id === u.id;
          return (
            <div
              key={u.id}
              className={cn(
                "flex items-center gap-1 rounded-xl border transition-colors",
                active ? "border-primary bg-primary/10" : "border-border bg-elevated"
              )}
            >
              <button onClick={() => setViewAs(u)} className="flex-1 flex items-center gap-2 px-4 py-3 text-[14px] font-bold text-left min-w-0">
                {active ? <Check className="w-4 h-4 text-primary flex-shrink-0" /> : <Eye className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                <span className="min-w-0">
                  <span className={cn("block truncate", active ? "text-foreground" : "text-muted-foreground")}>{u.name}</span>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-primary">
                    {u.memberStatus === "GOLD" ? "Gold" : "Standard"}
                  </span>
                </span>
              </button>
              <button
                onClick={() => removeTestUser(u.id)}
                title="Testnutzer entfernen"
                className="w-8 h-8 mr-1.5 rounded-full bg-destructive/15 text-destructive flex items-center justify-center flex-shrink-0 hover:bg-destructive/25"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()} placeholder="Noch einen Testnutzer — Name" className={input} />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="px-4 py-3 rounded-xl bg-background border border-border text-[15px] font-semibold text-foreground focus:outline-none focus:border-primary/50">
          <option value="STANDARD">Standard</option>
          <option value="GOLD">Gold</option>
        </select>
        <button onClick={add} className="inline-flex items-center gap-2 px-5 py-3 rounded-full glass-btn glass-btn-accent text-[14px] font-bold text-gloss">
          <Plus className="w-4 h-4" /> Hinzufügen
        </button>
      </div>
    </div>
  );
}