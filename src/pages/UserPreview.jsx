import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Eye, Check, RotateCcw, Loader2 } from "lucide-react";
import { loadLayout, layoutMenu } from "@/lib/siteLayout";
import { buildNavGroups } from "@/components/nav/HeaderNav";
import { getViewAs, setViewAs, subscribeViewAs, testUsers } from "@/lib/viewAs";
import { cn } from "@/lib/utils";

// Vorschau als Nutzer: die Leiste genau so, wie ein ausgewählter Nutzer sie
// sieht. Der Blick wechselt mit einem Klick — angemeldet bleibst du dabei du.
export default function UserPreview() {
  const [users, setUsers] = useState(testUsers);
  const [current, setCurrent] = useState(getViewAs);
  const [groups, setGroups] = useState(null);

  useEffect(() => subscribeViewAs(() => { setUsers(testUsers()); setCurrent(getViewAs()); }), []);

  useEffect(() => {
    loadLayout()
      .then((row) => setGroups(buildNavGroups(layoutMenu(row))))
      .catch(() => setGroups([]));
  }, []);

  const name = current?.name || "";

  return (
    <div className="w-full px-4 lg:px-10 py-8">
      <div className="mb-6">
        <h1 className="font-display text-4xl text-foreground text-gloss flex items-center gap-3">
          <Eye className="w-8 h-8 text-primary" /> Vorschau als Nutzer
        </h1>
        <p className="text-[15px] font-semibold text-muted-foreground mt-2 max-w-3xl leading-relaxed">
          Wähle einen Nutzer und sieh die Leiste mit seinen Augen. Du bist dabei immer noch du — es ist nur die Ansicht.
        </p>
      </div>

      <div className="glass rounded-2xl border border-border p-5 mb-5">
        <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-3">Als wen schaust du?</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <button
            onClick={() => setViewAs(null)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 rounded-xl border text-[14px] font-bold text-left transition-colors",
              !current ? "border-primary bg-primary/10 text-foreground" : "border-border bg-elevated text-muted-foreground hover:text-foreground"
            )}
          >
            {!current ? <Check className="w-4 h-4 text-primary flex-shrink-0" /> : <Eye className="w-4 h-4 flex-shrink-0" />}
            <span className="truncate">Ich selbst</span>
          </button>
          {users.map((u) => {
            const active = current?.id === u.id;
            return (
              <button
                key={u.id}
                onClick={() => setViewAs(u)}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 rounded-xl border text-[14px] font-bold text-left transition-colors",
                  active ? "border-primary bg-primary/10 text-foreground" : "border-border bg-elevated text-muted-foreground hover:text-foreground"
                )}
              >
                {active ? <Check className="w-4 h-4 text-primary flex-shrink-0" /> : <Eye className="w-4 h-4 flex-shrink-0" />}
                <span className="min-w-0">
                  <span className="block truncate">{u.name}</span>
                  <span className="block text-[11px] font-bold uppercase tracking-wider text-primary">
                    {u.memberStatus === "GOLD" ? "Gold" : "Standard"}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="glass rounded-2xl border-2 border-border p-5">
        <p className="text-[12px] font-bold uppercase tracking-wider text-muted-foreground mb-3">
          Die Leiste{name ? ` für ${name}` : ""}
        </p>
        {groups === null ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {groups.map((group) => (
              <div key={group.label} className="min-w-[180px]">
                <p className="text-[14px] font-bold text-foreground mb-2">{group.label}</p>
                <div className="space-y-1">
                  {group.items.map((item) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className="block text-[13px] font-semibold text-muted-foreground hover:text-primary transition-colors"
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-[13px] font-semibold text-muted-foreground mt-4">
          {current
            ? `Du schaust gerade als ${name}. Zurück zu dir: oben auf „Ich selbst" tippen.`
            : "Du schaust als du selbst. Wähle oben einen Nutzer, um zu wechseln."}
        </p>
      </div>

      {current && (
        <button
          onClick={() => setViewAs(null)}
          className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass-btn text-[14px] font-bold text-foreground"
        >
          <RotateCcw className="w-4 h-4" /> Zurück zu mir
        </button>
      )}
    </div>
  );
}