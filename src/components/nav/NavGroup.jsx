import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, Info } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Ein Block der Kopfzeile — mit Erklärung zum Aufklappen, wenn die
// Erklärungen eingeschaltet sind.
export default function NavGroup({ group, waitingChats = 0, showInfo = false, info = "" }) {
  const location = useLocation();
  const [showText, setShowText] = useState(false);
  const active = group.items.some((l) => l.path === location.pathname);

  return (
    <DropdownMenu>
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
      <DropdownMenuContent align="center" className="glass-strong border-border max-h-[70vh] overflow-y-auto min-w-[240px]">
        {showInfo && info && (
          <div className="px-2 pt-2 pb-1">
            <button
              type="button"
              onClick={() => setShowText((v) => !v)}
              className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg text-[12px] font-bold text-primary hover:bg-primary/10 transition-colors"
            >
              <Info className="w-3.5 h-3.5" /> Was ist das?
            </button>
            {showText && (
              <p className="px-2 pb-2 pt-1 text-[12px] font-semibold text-muted-foreground leading-relaxed">{info}</p>
            )}
          </div>
        )}
        {group.items.map((l) => (
          <DropdownMenuItem key={l.path} asChild>
            <Link to={l.path} className="text-sm font-semibold cursor-pointer">
              {l.label}
              {l.path === "/leitstand" && waitingChats > 0 && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold">
                  {waitingChats}
                </span>
              )}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}