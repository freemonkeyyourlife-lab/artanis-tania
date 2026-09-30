import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Die Kopfzeile hat vier Bereiche statt acht einzelner Knöpfe.
// „Erleben" ist der Menüpunkt-Block, den du in der Besitzer-Konsole sortierst.
const PERSON_ITEMS = [
  { label: "Artanis", path: "/artanis" },
  { label: "Triania", path: "/triania" },
  { label: "Couple", path: "/couple" },
];

const CREATE_ITEMS = [
  { label: "Studio", path: "/studio" },
  { label: "Dockingstation", path: "/dock" },
  { label: "Kasse", path: "/paylinks" },
];

const ADMIN_ITEMS = [
  { label: "Verwaltung", path: "/admin" },
  { label: "Leitstand", path: "/leitstand" },
  { label: "Besitzer-Konsole", path: "/owner" },
];

const DEFAULT_EXPLORE = [
  { label: "Nachrichten", path: "/messages" },
  { label: "Wettbewerbe", path: "/contests" },
  { label: "Live", path: "/live" },
  { label: "Interaktiv", path: "/interactive" },
  { label: "Entdecken", path: "/explore" },
];

// Kein Eintrag taucht zweimal auf — auch wenn dein Menü einen Punkt enthält,
// der schon in einem anderen Block steht.
export function buildNavGroups(menuItems = []) {
  const seen = new Set();
  const groups = [
    { label: "Personen", items: PERSON_ITEMS },
    { label: "Selbst erstellen", items: CREATE_ITEMS },
    { label: "Erleben", items: menuItems.length ? menuItems : DEFAULT_EXPLORE },
    { label: "Verwaltung", items: ADMIN_ITEMS },
  ];
  return groups
    .map((group) => ({
      label: group.label,
      items: group.items.filter((item) => {
        if (seen.has(item.path)) return false;
        seen.add(item.path);
        return true;
      }),
    }))
    .filter((group) => group.items.length > 0);
}

export default function HeaderNav({ groups, font, waitingChats = 0 }) {
  const location = useLocation();

  return (
    <nav
      className="hidden lg:flex items-center"
      style={{ gap: `${font.gap}px`, fontSize: `${font.fontSize}px`, fontWeight: font.fontWeight }}
    >
      {groups.map((group) => {
        const active = group.items.some((l) => l.path === location.pathname);
        return (
          <DropdownMenu key={group.label}>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "px-4 py-2 rounded-full whitespace-nowrap text-gloss transition-colors flex items-center gap-1",
                  active ? "text-primary bg-primary/10" : "text-foreground hover:text-primary"
                )}
              >
                {group.label} <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="glass-strong border-border max-h-[70vh] overflow-y-auto">
              {group.items.map((l) => (
                <DropdownMenuItem key={l.path} asChild>
                  <Link to={l.path} className="text-sm font-semibold cursor-pointer">
                    {l.label}
                    {l.path === "/leitstand" && waitingChats > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">{waitingChats}</span>
                    )}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      })}
    </nav>
  );
}