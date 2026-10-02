import React, { useEffect, useState } from "react";
import { ShieldCheck, User, Eye } from "lucide-react";
import { getViewAs, setViewAs, subscribeViewAs, testUsers } from "@/lib/viewAs";
import { cn } from "@/lib/utils";

// View-As: ein Klick zwischen deiner Ansicht und der eines normalen Nutzers —
// damit du das Layout so prüfst, wie es bei ihm ankommt. Gespeichert wird nichts.
export default function ViewAsSwitch() {
  const [current, setCurrent] = useState(getViewAs());
  const [users, setUsers] = useState(testUsers);

  useEffect(
    () =>
      subscribeViewAs(() => {
        setCurrent(getViewAs());
        setUsers(testUsers());
      }),
    []
  );

  // Der erste Testnutzer ohne Gold ist der normale Fall.
  const normalUser = users.find((u) => u.memberStatus !== "GOLD") || users[0];
  const asUser = !!current;

  return (
    <div className="glass rounded-2xl border-2 border-border p-5 mb-5">
      <p className="font-display text-xl text-foreground mb-1 flex items-center gap-2">
        <Eye className="w-5 h-5 text-primary" /> View-As
      </p>
      <p className="text-[15px] font-semibold text-muted-foreground mb-4 max-w-3xl">
        Ein Klick, und die Leiste zeigt sich so, wie ein normaler Nutzer sie sieht — ohne Verwaltung. Zurück geht es
        genauso schnell. Gespeichert oder verändert wird dabei nichts.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={() => setViewAs(null)}
          className={cn(
            "inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] font-bold transition-colors",
            asUser ? "glass-btn text-muted-foreground hover:text-foreground" : "glass-btn glass-btn-accent text-gloss"
          )}
        >
          <ShieldCheck className="w-4 h-4" /> Admin-Ansicht
        </button>
        <button
          onClick={() => setViewAs(normalUser)}
          disabled={!normalUser}
          className={cn(
            "inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[14px] font-bold transition-colors disabled:opacity-50",
            asUser ? "glass-btn glass-btn-accent text-gloss" : "glass-btn text-muted-foreground hover:text-foreground"
          )}
        >
          <User className="w-4 h-4" /> Nutzer-Ansicht
        </button>

        {asUser && (
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-400/10 text-amber-300 text-[13px] font-bold">
            Gerade unterwegs als {current.name}
            <button onClick={() => setViewAs(null)} className="underline">
              beenden
            </button>
          </span>
        )}
      </div>
    </div>
  );
}