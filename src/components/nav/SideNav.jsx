import React from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import PageSearch from "@/components/nav/PageSearch";
import InviteShareButton from "@/components/InviteShareButton";
import InfoModeToggle from "@/components/InfoModeToggle";
import HelpAssistant from "@/components/help/HelpAssistant";

// Die ganze Leiste links: jeder Bereich und jede Funktion an einer Stelle.
// Unten stehen die kleinen Werkzeuge, damit die Kopfzeile frei bleibt.
export default function SideNav({ groups = [], isOwner = false }) {
  const { pathname } = useLocation();

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 z-40 flex-col glass-strong border-r border-border/40 overflow-y-auto scrollbar-hide pt-[72px]">
      <div className="px-3 py-4 space-y-5">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      "block truncate rounded-xl px-3 py-2 text-[13px] font-semibold transition-colors",
                      active
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto border-t border-border/40 px-3 py-4">
        <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          Werkzeuge
        </p>
        <div className="flex items-center gap-2 px-1">
          <PageSearch isOwner={isOwner} />
          <InfoModeToggle />
          <HelpAssistant />
        </div>
        <InviteShareButton className="mt-3 w-full justify-center" />
      </div>
    </aside>
  );
}