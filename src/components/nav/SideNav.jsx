import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { PanelLeftClose, PanelLeftOpen, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import PageSearch from "@/components/nav/PageSearch";
import InviteShareButton from "@/components/InviteShareButton";
import InfoModeToggle from "@/components/InfoModeToggle";
import HelpAssistant from "@/components/help/HelpAssistant";
import NarratorPanel from "@/components/nav/NarratorPanel";
import StudioSchublade from "@/components/studio/StudioSchublade";
import BrandWordmark from "@/components/BrandWordmark";

// Die ganze Leiste links, in dieser Reihenfolge:
// ganz oben „Artanis × Tania", darunter Einladen, dann alle Punkte in ihren
// Themen-Blöcken — und innerhalb jedes Blocks noch einmal nach Untergruppe
// geordnet, damit nichts in einer langen Liste verschwindet. Den Rest der Höhe
// nimmt die Erzählerin ein — in groß.
export default function SideNav({ groups = [], isOwner = false, collapsed = false, onToggleCollapse }) {
  const { pathname } = useLocation();
  const [studioOpen, setStudioOpen] = useState(false);

  const renderLink = (item) => {
    const active = pathname === item.path;
    return (
      <Link
        key={item.path}
        to={item.path}
        className={cn(
          "block truncate rounded-xl px-3 py-2 text-[14px] font-bold transition-colors",
          active
            ? "bg-primary/10 text-primary"
            : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
        )}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <aside className={cn(
      "hidden lg:flex fixed left-0 top-0 bottom-0 z-40 flex-col glass-strong border-r border-border/40 transition-all duration-300",
      collapsed ? "w-14" : "w-64"
    )}>
      {/* Ganz oben links: die Marke — direkt an der oberen Kante. Darunter: Einladen.
          Eingeklappt bleibt nur der Balken mit dem Aufklapp-Knopf. */}
      <div className="px-3 pt-5 pb-3 border-b border-border/40 flex items-center justify-between">
        {collapsed ? (
          <button
            onClick={onToggleCollapse}
            title="Leiste aufklappen"
            className="w-8 h-8 rounded-full glass-btn flex items-center justify-center text-muted-foreground hover:text-primary mx-auto"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        ) : (
          <>
            <Link to="/" className="block px-2 py-1.5">
              <BrandWordmark className="text-[17px] text-foreground" />
            </Link>
            <button
              onClick={onToggleCollapse}
              title="Leiste einklappen"
              className="w-8 h-8 rounded-full glass-btn flex items-center justify-center text-muted-foreground hover:text-primary flex-shrink-0"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </>
        )}
      </div>

      {!collapsed && (
        <>
          <InviteShareButton className="mx-3 mt-3 w-auto justify-center" />

          {/* Alle Punkte — in Themen-Blöcken, in der Reihenfolge des Besitzers.
              Hat ein Block mehrere Untergruppen, bekommen diese eigene
              Zwischenüberschriften, statt alles in eine flache Liste zu kippen. */}
          <div className="shrink-0 max-h-[42vh] overflow-y-auto scrollbar-hide px-3 py-4 space-y-5">
            {groups.map((group) => {
              const subs = group.groups || [];
              const showSubs = subs.length > 1;
              return (
                <div key={group.label}>
                  <p className="mb-1.5 px-2 text-[12px] font-bold uppercase tracking-wider text-primary">
                    {group.label}
                  </p>
                  {showSubs ? (
                    <div className="space-y-2.5">
                      {subs.map((sub) => (
                        <div key={sub.label}>
                          <p className="mb-0.5 px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                            {sub.label}
                          </p>
                          <div className="space-y-0.5">{sub.items.map(renderLink)}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-0.5">{group.items.map(renderLink)}</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Die Erzählerin in groß — volle Breite, die restliche Höhe. */}
          <NarratorPanel />

          <div className="border-t border-border/40 px-3 py-3 space-y-2">
            {isOwner && (
              <button
                onClick={() => setStudioOpen(true)}
                title="Studio-Schublade öffnen"
                className="w-full inline-flex items-center justify-center gap-1.5 rounded-full glass-btn glass-btn-accent px-3 py-2 text-[12px] font-bold text-gloss"
              >
                <Sparkles className="w-3.5 h-3.5" /> Studio-Schublade
              </button>
            )}
            <div className="flex items-center gap-2 px-1">
              <PageSearch isOwner={isOwner} />
              <InfoModeToggle />
              <HelpAssistant />
            </div>
          </div>
          {studioOpen && <StudioSchublade onClose={() => setStudioOpen(false)} />}
        </>
      )}
    </aside>
  );
}